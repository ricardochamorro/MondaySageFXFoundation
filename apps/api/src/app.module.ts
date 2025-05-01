import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from 'nestjs-pino'
import { BullModule } from '@nestjs/bull'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { MondayModule } from './monday/monday.module'
import { SmsModule } from './sms/sms.module'
import { PdfModule } from './pdf/pdf.module'
import * as path from 'path'

// Debug environment variables
console.log('Environment Variables:', {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set',
  JWT_SECRET_LENGTH: process.env.JWT_SECRET?.length,
  MONDAY_CLIENT_ID: process.env.MONDAY_CLIENT_ID ? 'Set' : 'Not Set',
  MONDAY_CALLBACK_URL: process.env.MONDAY_CALLBACK_URL
})

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '.env'),
      cache: true,
      expandVariables: true,
    }),
    LoggerModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    MondayModule,
    SmsModule,
    PdfModule,
  ],
})
export class AppModule {} 