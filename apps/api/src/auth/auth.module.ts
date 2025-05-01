import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { MondayStrategy } from './strategies/monday.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';
import { Type } from '@nestjs/common';

// Debug JWT secret
console.log('JWT Secret:', {
  secret: process.env.JWT_SECRET,
  length: process.env.JWT_SECRET?.length,
  type: typeof process.env.JWT_SECRET,
});

interface PassportSerializer {
  serializeUser: (user: User, done: (err: Error | null, id?: string) => void) => void;
  deserializeUser: (id: string, done: (err: Error | null, user?: User) => void) => void;
}

interface PassportSerializerFactory {
  (usersService: UsersService): PassportSerializer;
}

interface PassportSerializerProvider {
  provide: string;
  useFactory: PassportSerializerFactory;
  inject: Type<unknown>[];
}

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ session: true }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
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
      useFactory: ((usersService: UsersService): PassportSerializer => ({
        serializeUser: (user: User, done: (err: Error | null, id?: string) => void) => {
          done(null, user.id);
        },
        deserializeUser: async (id: string, done: (err: Error | null, user?: User) => void) => {
          try {
            const user = await usersService.findById(id);
            done(null, user);
          } catch (err) {
            done(err);
          }
        },
      })) as PassportSerializerFactory,
      inject: [UsersService],
    } as PassportSerializerProvider,
  ],
  exports: [AuthService],
})
export class AuthModule {}
