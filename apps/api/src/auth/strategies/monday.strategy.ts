import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { AuthService } from '../auth.service';
import axios, { AxiosError, AxiosResponse } from 'axios';

interface MondayUser {
  id: string;
  name: string;
  email: string;
}

interface MondayProfile {
  id: string;
  name: string;
  email: string;
  account_id: string;
}

interface MondayResponse {
  data: MondayUser;
  errors?: Array<{ message: string }>;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface TokenRequestConfig {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  data?: unknown;
}

interface TokenRequestError extends Error {
  config?: TokenRequestConfig;
  response?: {
    status?: number;
    statusText?: string;
    data?: unknown;
    headers?: unknown;
  };
}

@Injectable()
export class MondayStrategy extends PassportStrategy(Strategy, 'monday') {
  constructor(private readonly authService: AuthService) {
    super({
      authorizationURL: 'https://auth.monday.com/oauth2/authorize',
      tokenURL: 'https://auth.monday.com/oauth2/token',
      clientID: process.env.MONDAY_CLIENT_ID,
      clientSecret: process.env.MONDAY_CLIENT_SECRET,
      callbackURL: process.env.MONDAY_CALLBACK_URL,
      scope: ['boards:read', 'boards:write', 'users:read'],
    });

    console.log('Monday OAuth Config:', {
      clientID: process.env.MONDAY_CLIENT_ID,
      callbackURL: process.env.MONDAY_CALLBACK_URL,
      scope: ['boards:read', 'boards:write', 'users:read'],
      authorizationURL: 'https://auth.monday.com/oauth2/authorize',
      tokenURL: 'https://auth.monday.com/oauth2/token',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: MondayProfile) {
    console.log('Validating Monday.com user:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      profile,
    });
    try {
      // Get current user profile from Monday.com using REST API
      const response: AxiosResponse<MondayResponse> = await axios.get(
        'https://api.monday.com/v2/me',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'API-Version': '2024-10',
          },
        }
      );

      // Check if we have errors in the response
      if (response.data?.errors?.length > 0) {
        console.error('Monday.com API returned errors:', {
          errors: response.data.errors,
          data: response.data,
          headers: response.headers,
          status: response.status,
        });
        throw new UnauthorizedException(
          'Monday.com API returned errors: ' + response.data.errors[0].message
        );
      }

      // Check if we have the expected data structure
      if (!response.data?.data) {
        console.error('Invalid response structure from Monday.com:', {
          data: response.data,
          headers: response.headers,
          status: response.status,
        });
        throw new UnauthorizedException('Invalid response structure from Monday.com');
      }

      const currentUser = response.data.data;
      console.log('Monday.com user:', currentUser);

      // Create profile from the current user's data
      const mondayProfile: MondayProfile = {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        account_id: currentUser.id, // Using user ID as account ID
      };

      console.log('Constructed Monday.com profile:', mondayProfile);

      const user = await this.authService.validateMondayUser(
        accessToken,
        refreshToken,
        mondayProfile
      );
      if (!user) {
        throw new UnauthorizedException('Invalid Monday.com credentials');
      }
      return user;
    } catch (error) {
      console.error('Error validating Monday.com user:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof AxiosError ? error.response?.data : undefined,
        status: error instanceof AxiosError ? error.response?.status : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new UnauthorizedException(
        error instanceof Error ? error.message : 'Invalid Monday.com credentials'
      );
    }
  }

  async userProfile(
    accessToken: string,
    done: (err: Error | null, profile?: MondayProfile) => void
  ) {
    // Return an empty profile since we'll get the actual profile in validate()
    done(null, undefined);
  }

  async _oauth2GetOAuthAccessToken(
    code: string,
    params: Record<string, string>,
    callback: (
      err: Error | null,
      accessToken?: string,
      refreshToken?: string,
      params?: TokenResponse
    ) => void
  ) {
    try {
      console.log('Exchanging code for token:', {
        code,
        clientId: process.env.MONDAY_CLIENT_ID,
        callbackUrl: process.env.MONDAY_CALLBACK_URL,
        params,
        tokenURL: 'https://auth.monday.com/oauth2/token',
      });

      const tokenRequestData = new URLSearchParams({
        client_id: process.env.MONDAY_CLIENT_ID,
        client_secret: process.env.MONDAY_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.MONDAY_CALLBACK_URL,
      }).toString();

      console.log('Token request data:', {
        requestData: tokenRequestData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const response = await axios
        .post<TokenResponse>('https://auth.monday.com/oauth2/token', tokenRequestData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        .catch((error: TokenRequestError) => {
          console.error('Detailed token exchange error:', {
            message: error.message,
            response: {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              headers: error.response?.headers,
            },
            request: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
              data: error.config?.data,
            },
          });
          throw error;
        });

      console.log('Token exchange response:', {
        status: response.status,
        hasAccessToken: !!response.data?.access_token,
        hasRefreshToken: !!response.data?.refresh_token,
        data: response.data,
        headers: response.headers,
      });

      if (response.data?.access_token) {
        callback(null, response.data.access_token, response.data.refresh_token, response.data);
      } else {
        console.error('Failed to get access token:', {
          responseData: response.data,
          responseStatus: response.status,
          responseHeaders: response.headers,
        });
        callback(new Error('Failed to get access token'));
      }
    } catch (error) {
      console.error('Error exchanging code for token:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: error instanceof AxiosError ? error.response?.data : undefined,
        status: error instanceof AxiosError ? error.response?.status : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      });
      callback(error instanceof Error ? error : new Error('Unknown error during token exchange'));
    }
  }
}
