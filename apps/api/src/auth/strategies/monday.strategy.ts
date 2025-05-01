import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-oauth2'
import { AuthService } from '../auth.service'
import axios from 'axios'

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
    })

    console.log('Monday OAuth Config:', {
      clientID: process.env.MONDAY_CLIENT_ID,
      callbackURL: process.env.MONDAY_CALLBACK_URL,
      scope: ['boards:read', 'boards:write', 'users:read'],
      authorizationURL: 'https://auth.monday.com/oauth2/authorize',
      tokenURL: 'https://auth.monday.com/oauth2/token',
    })
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    console.log('Validating Monday.com user:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      profile,
    })
    try {
      // Get user profile from Monday.com using GraphQL API
      const response = await axios.post(
        'https://api.monday.com/v2',
        {
          query: `
            query {
              users {
                id
                name
              }
            }
          `,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'API-Version': '2025-01',
          },
        },
      ).catch(error => {
        console.error('Detailed API error:', {
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
        })
        throw error
      })

      // Log the API version from response headers
      console.log('API Version from response:', response.headers['api-version'])

      console.log('Monday.com API Response:', {
        status: response.status,
        data: response.data,
        errors: response.data?.errors,
        headers: response.headers,
      })

      // Check if we have errors in the response
      if (response.data?.errors?.length > 0) {
        console.error('Monday.com API returned errors:', {
          errors: response.data.errors,
          data: response.data,
        })
        throw new UnauthorizedException('Monday.com API returned errors: ' + response.data.errors[0].message)
      }

      // Check if we have the expected data structure
      if (!response.data?.data?.users) {
        console.error('Invalid response structure from Monday.com:', {
          data: response.data,
        })
        throw new UnauthorizedException('Invalid response structure from Monday.com')
      }

      const users = response.data.data.users
      console.log('Monday.com users:', users)

      // Create profile from available data
      const mondayProfile = {
        id: users[0]?.id || 'unknown',
        name: users[0]?.name || 'Monday User',
        email: `${users[0]?.name?.toLowerCase().replace(/\s+/g, '.')}@monday.com`,
        account_id: response.data.account_id || 'unknown'
      }

      console.log('Constructed Monday.com profile:', mondayProfile)

      const user = await this.authService.validateMondayUser(accessToken, refreshToken, mondayProfile)
      if (!user) {
        throw new UnauthorizedException('Invalid Monday.com credentials')
      }
      return user
    } catch (error) {
      console.error('Error validating Monday.com user:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack,
      })
      throw new UnauthorizedException(error.message || 'Invalid Monday.com credentials')
    }
  }

  async userProfile(accessToken: string, done: (err?: Error | null, profile?: any) => void) {
    // Return an empty profile since we'll get the actual profile in validate()
    done(null, {})
  }

  async _oauth2GetOAuthAccessToken(code: string, params: any, callback: (err: Error | null, accessToken?: string, refreshToken?: string, params?: any) => void) {
    try {
      console.log('Exchanging code for token:', {
        code,
        clientId: process.env.MONDAY_CLIENT_ID,
        callbackUrl: process.env.MONDAY_CALLBACK_URL,
        params,
        tokenURL: 'https://auth.monday.com/oauth2/token',
      })

      const tokenRequestData = new URLSearchParams({
        client_id: process.env.MONDAY_CLIENT_ID,
        client_secret: process.env.MONDAY_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.MONDAY_CALLBACK_URL,
      }).toString()

      console.log('Token request data:', {
        requestData: tokenRequestData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      const response = await axios.post(
        'https://auth.monday.com/oauth2/token',
        tokenRequestData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ).catch(error => {
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
        })
        throw error
      })

      console.log('Token exchange response:', {
        status: response.status,
        hasAccessToken: !!response.data?.access_token,
        hasRefreshToken: !!response.data?.refresh_token,
        data: response.data,
        headers: response.headers,
      })

      if (response.data?.access_token) {
        callback(null, response.data.access_token, response.data.refresh_token, response.data)
      } else {
        console.error('Failed to get access token:', {
          responseData: response.data,
          responseStatus: response.status,
          responseHeaders: response.headers,
        })
        callback(new Error('Failed to get access token'))
      }
    } catch (error) {
      console.error('Error exchanging code for token:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
        stack: error.stack,
      })
      callback(error)
    }
  }
} 