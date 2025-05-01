import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { UsersService } from '../users/users.service'
import { compare } from 'bcrypt'
import axios from 'axios'
import { PrismaService } from '../prisma/prisma.service'
import { UserState } from '@prisma/client'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...result } = user
    return result
  }

  async login(user: any) {
    this.logger.debug('Login attempt:', {
      userId: user.id,
      email: user.email,
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length
    })
    
    const payload = { email: user.email, sub: user.id }
    return {
      access_token: this.jwtService.sign(payload),
    }
  }

  async validateMondayUser(accessToken: string, refreshToken: string, profile: any) {
    try {
      this.logger.debug('Validating Monday.com user with profile:', profile)
      
      if (!profile || !profile.email) {
        throw new UnauthorizedException('Invalid Monday.com user profile')
      }

      // Find or create user
      let user = await this.usersService.findByEmail(profile.email)
      this.logger.debug('Found existing user:', user)
      
      if (!user) {
        // Create new user
        this.logger.debug('Creating new user with email:', profile.email)
        user = await this.usersService.create({
          email: profile.email,
          password: '', // No password for OAuth users
          name: profile.name,
          state: 'ACTIVE' as UserState, // Explicitly cast to UserState enum
        })
        this.logger.debug('Created new user:', user)
      }

      if (!user || !user.id) {
        this.logger.error('User creation/lookup failed:', { user })
        throw new UnauthorizedException('Failed to create or find user')
      }

      // Update Monday.com account
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      if (user.mondayAccount) {
        this.logger.debug('Updating existing Monday account for user:', user.id)
        await this.prisma.mondayAccount.update({
          where: { userId: user.id },
          data: {
            accessToken,
            refreshToken: refreshToken || '', // Provide default empty string if undefined
            expiresAt,
          },
        })
      } else {
        this.logger.debug('Creating new Monday account for user:', user.id)
        // Create new Monday account with proper user connection
        await this.prisma.mondayAccount.create({
          data: {
            accountId: profile.account_id || 'unknown',
            accessToken,
            refreshToken: refreshToken || '', // Provide default empty string if undefined
            expiresAt,
            user: {
              connect: {
                id: user.id
              }
            }
          },
        })
      }

      return user
    } catch (error) {
      this.logger.error('Monday.com validation error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      })
      throw new UnauthorizedException('Invalid Monday.com credentials')
    }
  }
} 