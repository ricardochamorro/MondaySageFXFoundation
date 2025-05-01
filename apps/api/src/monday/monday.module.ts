import { Module } from '@nestjs/common'
import { MondayService } from './monday.service'
import { MondayController } from './monday.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [MondayController],
  providers: [MondayService],
  exports: [MondayService],
})
export class MondayModule {} 