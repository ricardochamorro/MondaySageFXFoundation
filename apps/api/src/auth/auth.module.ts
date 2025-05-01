import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { JwtStrategy } from './strategies/jwt.strategy'
import { LocalStrategy } from './strategies/local.strategy'
import { MondayStrategy } from './strategies/monday.strategy'
import { UsersModule } from '../users/users.module'
import { PrismaModule } from '../prisma/prisma.module'
import { UsersService } from '../users/users.service'

// Debug JWT secret
console.log('JWT Secret:', {
  secret: process.env.JWT_SECRET,
  length: process.env.JWT_SECRET?.length,
  type: typeof process.env.JWT_SECRET
})

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET')
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables')
        }
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        }
      },
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    MondayStrategy,
    {
      provide: 'PassportSerializer',
      useFactory: (usersService: UsersService) => ({
        serializeUser: (user: any, done: (err: any, id?: any) => void) => {
          done(null, user.id);
        },
        deserializeUser: async (id: string, done: (err: any, user?: any) => void) => {
          try {
            const user = await usersService.findById(id);
            done(null, user);
          } catch (err) {
            done(err);
          }
        },
      }),
      inject: [UsersService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {} 