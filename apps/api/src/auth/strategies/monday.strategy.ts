import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface MondayUser {
  id: string;
  name: string;
  email: string;
  photo_thumb: string;
}

interface MondayAccount {
  id: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

@Injectable()
export class MondayStrategy extends PassportStrategy(Strategy, 'monday') {
  private readonly logger = new Logger(MondayStrategy.name);

  constructor(private configService: ConfigService) {
    super({
      authorizationURL: 'https://auth.monday.com/oauth2/authorize',
      tokenURL: 'https://auth.monday.com/oauth2/token',
      clientID: configService.get<string>('MONDAY_CLIENT_ID'),
      clientSecret: configService.get<string>('MONDAY_CLIENT_SECRET'),
      callbackURL: configService.get<string>('MONDAY_CALLBACK_URL'),
      scope: ['boards:read', 'boards:write', 'users:read'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: MondayUser
  ): Promise<MondayAccount> {
    try {
      // Get user's boards to verify access
      const response = await axios.get('https://api.monday.com/v2', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          query: '{ boards { id name } }',
        },
      });

      if (!response.data || !response.data.data || !response.data.data.boards) {
        throw new Error('Failed to fetch Monday.com boards');
      }

      // Calculate token expiration (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      return {
        id: profile.id,
        name: profile.name,
        accessToken,
        refreshToken,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Error validating Monday.com user:', error);
      throw error;
    }
  }
}
