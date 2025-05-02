import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { compare } from 'bcrypt';
import axios, { AxiosError } from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserState } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

interface MondayProfile {
  id: string;
  name: string;
  email: string;
  account_id: string;
}

interface JwtPayload {
  email: string;
  sub: string;
}

interface UserWithoutPassword extends Omit<User, 'password'> {}

interface MondayTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface MondayCallbackUser {
  id: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: passwordHash, ...result } = user;
    return result;
  }

  async login(user: UserWithoutPassword) {
    this.logger.debug('Login attempt:', {
      userId: user.id,
      email: user.email,
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length,
    });

    const payload: JwtPayload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateMondayUser(
    accessToken: string,
    refreshToken: string,
    profile: MondayProfile
  ): Promise<User> {
    try {
      this.logger.debug('Validating Monday.com user with profile:', profile);

      if (!profile || !profile.email) {
        throw new UnauthorizedException('Invalid Monday.com user profile');
      }

      // Find or create user
      let user = await this.usersService.findByEmail(profile.email);
      this.logger.debug('Found existing user:', user);

      if (!user) {
        // Create new user
        this.logger.debug('Creating new user with email:', profile.email);
        user = await this.usersService.create({
          email: profile.email,
          password: '', // No password for OAuth users
          name: profile.name,
          state: 'ACTIVE' as UserState,
        });
        this.logger.debug('Created new user:', user);
      }

      if (!user || !user.id) {
        this.logger.error('User creation/lookup failed:', { user });
        throw new UnauthorizedException('Failed to create or find user');
      }

      // Update Monday.com account
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Always update or create the Monday account
      const mondayAccountData = {
        accountId: profile.account_id || 'unknown',
        accessToken,
        refreshToken: refreshToken || '', // Provide default empty string if undefined
        expiresAt,
        userId: user.id,
      };

      try {
        // Try to update first
        await this.prisma.mondayAccount.upsert({
          where: { userId: user.id },
          update: mondayAccountData,
          create: mondayAccountData,
        });

        // Fetch the updated user with the Monday account
        const updatedUser = await this.usersService.findById(user.id);
        return updatedUser;
      } catch (error) {
        this.logger.error('Error updating Monday account:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          mondayAccountData,
        });
        throw new UnauthorizedException('Failed to update Monday.com account');
      }
    } catch (error) {
      this.logger.error('Monday.com validation error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof AxiosError ? error.response?.data : undefined,
        status: error instanceof AxiosError ? error.response?.status : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException('Invalid Monday.com credentials');
    }
  }

  async refreshMondayToken(refreshToken: string, userId: string) {
    try {
      const response = await axios.post<MondayTokenResponse>(
        'https://auth.monday.com/oauth2/token',
        new URLSearchParams({
          client_id: process.env.MONDAY_CLIENT_ID,
          client_secret: process.env.MONDAY_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token } = response.data;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update the Monday account with new tokens
      const updatedAccount = await this.prisma.mondayAccount.update({
        where: { userId },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || refreshToken, // Use old refresh token if new one not provided
          expiresAt,
        },
      });

      return updatedAccount;
    } catch (error) {
      this.logger.error('Error refreshing Monday.com token:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof AxiosError ? error.response?.data : undefined,
        status: error instanceof AxiosError ? error.response?.status : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async handleMondayCallback(user: MondayCallbackUser) {
    try {
      const token = await this.jwtService.signAsync({
        sub: user.id,
        email: user.email,
        name: user.name,
      });

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'https://monday.sagefxfoundation.com'
      );
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;

      return { redirectUrl };
    } catch (error) {
      this.logger.error('Error handling Monday.com callback:', error);
      throw error;
    }
  }
}
