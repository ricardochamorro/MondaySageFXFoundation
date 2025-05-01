import { Controller, Post, Body, UseGuards, Get, Req, Res, Logger, UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { Public } from './decorators/public.decorator'
import { AuthGuard } from '@nestjs/passport'

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body)
  }

  @Public()
  @Get('monday')
  @UseGuards(AuthGuard('monday'))
  async mondayAuth() {
    // This will redirect to Monday.com OAuth page
  }

  @Public()
  @Get('monday/callback')
  @UseGuards(AuthGuard('monday'))
  async mondayCallback(@Req() req: any, @Res() res: any) {
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
      })

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
        })
        throw new UnauthorizedException('No user data received from Monday.com')
      }

      const user = req.user
      this.logger.debug('User data received:', {
        id: user.id,
        email: user.email,
        hasMondayAccount: !!user.mondayAccount,
      })

      const token = await this.authService.login(user)
      
      const frontendUrl = process.env.FRONTEND_URL || 'https://monday.sagefxfoundation.com'
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token.access_token}`
      this.logger.debug('Redirecting to frontend:', { redirectUrl, frontendUrl })
      
      // Redirect to frontend with token
      res.redirect(redirectUrl)
    } catch (error) {
      this.logger.error('Error in Monday.com callback:', {
        message: error.message,
        stack: error.stack,
        query: req.query,
        headers: req.headers,
        cookies: req.cookies,
      })
      
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'https://monday.sagefxfoundation.com'
      const errorMessage = encodeURIComponent(error.message || 'Authentication failed')
      res.redirect(`${frontendUrl}/auth/error?message=${errorMessage}`)
    }
  }
} 