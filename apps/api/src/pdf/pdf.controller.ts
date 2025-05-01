import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { PdfService } from './pdf.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate')
  async generatePdf(@Body() body: { html: string }) {
    return this.pdfService.generatePdf(body.html)
  }
} 