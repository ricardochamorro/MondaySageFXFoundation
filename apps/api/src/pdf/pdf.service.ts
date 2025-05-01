import { Injectable } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import * as puppeteer from 'puppeteer'

@Injectable()
export class PdfService {
  constructor(@InjectQueue('pdf') private pdfQueue: Queue) {}

  async generatePdf(html: string) {
    await this.pdfQueue.add('generate', {
      html,
    })
  }

  async processPdf(job: any) {
    const { html } = job.data
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      })
      const page = await browser.newPage()
      await page.setContent(html)
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      })
      await browser.close()
      return pdf
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error.message}`)
    }
  }
} 