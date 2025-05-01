import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common'
import { MondayService } from './monday.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('monday')
@UseGuards(JwtAuthGuard)
export class MondayController {
  constructor(private readonly mondayService: MondayService) {}

  @Get('boards')
  async getBoards(@Req() req: any) {
    return this.mondayService.getBoards(req.user.id)
  }

  @Get('boards/:boardId/items')
  async getBoardItems(@Req() req: any, @Param('boardId') boardId: string) {
    return this.mondayService.getBoardItems(req.user.id, boardId)
  }

  @Post('boards/:boardId/items')
  async createItem(
    @Req() req: any,
    @Param('boardId') boardId: string,
    @Body() body: { name: string; columnValues: Record<string, any> },
  ) {
    return this.mondayService.createItem(req.user.id, boardId, body.name, body.columnValues)
  }
} 