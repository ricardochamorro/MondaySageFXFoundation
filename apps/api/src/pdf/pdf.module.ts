import { Module } from '@nestjs/common'
import { PdfService } from './pdf.service'
import { PdfController } from './pdf.controller'
import { BullModule } from '@nestjs/bull'

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'pdf',
    }),
  ],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {} 