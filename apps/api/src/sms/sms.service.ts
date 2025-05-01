import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import axios from 'axios'

@Injectable()
export class SmsService {
  constructor(@InjectQueue('sms') private smsQueue: Queue) {}

  async sendSms(to: string, message: string) {
    await this.smsQueue.add('send', {
      to,
      message,
    })
  }

  async processSms(job: any) {
    const { to, message } = job.data
    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: message,
        }),
        {
          auth: {
            username: process.env.TWILIO_ACCOUNT_SID,
            password: process.env.TWILIO_AUTH_TOKEN,
          },
        },
      )
      return response.data
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error.message}`)
    }
  }
} 