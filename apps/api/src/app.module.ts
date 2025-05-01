import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MondayModule } from './monday/monday.module';
import { SmsModule } from './sms/sms.module';
import { PdfModule } from './pdf/pdf.module';
import * as path from 'path';
import * as fs from 'fs';

// Debug environment variables and .env file
const envPath = path.resolve(process.cwd(), '../../.env');
console.log('Current working directory:', process.cwd());
console.log('Looking for .env file at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: envPath,
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
