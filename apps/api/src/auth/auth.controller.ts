import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Res,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { Public } from './decorators/public.decorator';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';
import { AuthenticatedRequest } from './types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @Public()
  @Get('monday')
  @UseGuards(AuthGuard('monday'))
  async mondayAuth(@Req() req: AuthenticatedRequest) {
    // Store the JWT token and return URL in the session for later use
    const token = req.query.token as string;
    const returnUrl = req.query.returnUrl as string;
    if (token) {
      req.session.jwtToken = token;
    }
    if (returnUrl) {
      req.session.returnUrl = returnUrl;
    }
  }

  @Public()
  @Get('monday/callback')
  @UseGuards(AuthGuard('monday'))
  async mondayCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    try {
      this.logger.debug('Monday.com callback received:', {
        hasUser: !!req.user,
        query: req.query,
        headers: req.headers,
        cookies: req.cookies,
        body: req.body,
        rawBody: req.rawBody,
        params: req.params,
        originalUrl: req.originalUrl,
        method: req.method,
        session: req.session,
        passport: req._passport,
      });

      if (!req.user) {
        this.logger.error('No user data received from Monday.com', {
          query: req.query,
          headers: req.headers,
          body: req.body,
          rawBody: req.rawBody,
          params: req.params,
          originalUrl: req.originalUrl,
          method: req.method,
          session: req.session,
          passport: req._passport,
          stack: new Error().stack,
        });
        throw new UnauthorizedException('No user data received from Monday.com');
      }

      const user = req.user;
      this.logger.debug('User data received:', {
        id: user.id,
        hasMondayAccount: !!user.mondayAccount,
      });

      // Use the stored JWT token if available
      const token = req.session.jwtToken
        ? { access_token: req.session.jwtToken }
        : await this.authService.login(user);

      const frontendUrl = process.env.FRONTEND_URL || 'https://monday.sagefxfoundation.com';
      const returnUrl = req.session.returnUrl || '/dashboard';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token.access_token}&returnUrl=${encodeURIComponent(returnUrl)}`;
      this.logger.debug('Redirecting to frontend:', { redirectUrl, frontendUrl, returnUrl });

      // Clear the stored session data
      delete req.session.jwtToken;
      delete req.session.returnUrl;

      // Redirect to frontend with token
      res.redirect(redirectUrl);
    } catch (error) {
      this.logger.error('Error in Monday.com callback:', {
        message: error.message,
        stack: error.stack,
        query: req.query,
        headers: req.headers,
        cookies: req.cookies,
      });

      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'https://monday.sagefxfoundation.com';
      const errorMessage = encodeURIComponent(error.message || 'Authentication failed');
      res.redirect(`${frontendUrl}/auth/error?message=${errorMessage}`);
    }
  }

  @Get('monday/token')
  @UseGuards(JwtAuthGuard)
  async getMondayToken(@Req() req: AuthenticatedRequest) {
    try {
      this.logger.debug('Getting Monday.com token for user:', {
        userId: req.user?.id,
        hasMondayAccount: !!req.user?.mondayAccount,
      });

      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (!req.user.mondayAccount) {
        this.logger.error('No Monday.com account found for user:', {
          userId: req.user.id,
          userEmail: req.user.email,
        });
        throw new UnauthorizedException(
          'No Monday.com account found for user. Please connect your Monday.com account first.'
        );
      }

      // Check if token is about to expire (within 1 hour)
      const expirationThreshold = new Date(Date.now() + 60 * 60 * 1000);
      if (new Date(req.user.mondayAccount.expiresAt) <= expirationThreshold) {
        this.logger.debug('Monday.com token needs refresh:', {
          userId: req.user.id,
          expiresAt: req.user.mondayAccount.expiresAt,
        });

        // Attempt to refresh the token
        try {
          const refreshedToken = await this.authService.refreshMondayToken(
            req.user.mondayAccount.refreshToken,
            req.user.id
          );
          return {
            access_token: refreshedToken.accessToken,
            expires_at: refreshedToken.expiresAt,
          };
        } catch (refreshError) {
          this.logger.error('Error refreshing Monday.com token:', {
            message: refreshError.message,
            stack: refreshError.stack,
            userId: req.user?.id,
          });
          throw refreshError;
        }
      }

      return {
        access_token: req.user.mondayAccount.accessToken,
        expires_at: req.user.mondayAccount.expiresAt,
      };
    } catch (error) {
      this.logger.error('Error getting Monday.com token:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
      });
      throw error;
    }
  }
}
