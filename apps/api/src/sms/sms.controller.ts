import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { SmsService } from './sms.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('sms')
@UseGuards(JwtAuthGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  async sendSms(@Body() body: { to: string; message: string }) {
    return this.smsService.sendSms(body.to, body.message)
  }
} 