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

  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @Public()
  @Get('monday')
  @UseGuards(AuthGuard('monday'))
  async mondayAuth() {
    // This route initiates the Monday.com OAuth flow
  }

  @Public()
  @Get('monday/callback')
  @UseGuards(AuthGuard('monday'))
  async mondayCallback(@Req() req, @Res() res: Response) {
    const result = await this.authService.handleMondayCallback(req.user);
    res.redirect(result.redirectUrl);
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
