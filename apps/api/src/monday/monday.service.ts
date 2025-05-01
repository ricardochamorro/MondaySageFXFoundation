import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MondayService {
  constructor(private prisma: PrismaService) {}

  async getBoards(userId: string) {
    const boards = await this.prisma.$queryRaw`
      SELECT * FROM "Board"
      WHERE "userId" = ${userId}
    `
    return boards
  }

  async getBoardItems(userId: string, boardId: string) {
    const board = await this.prisma.$queryRaw`
      SELECT * FROM "Board"
      WHERE "id" = ${boardId} AND "userId" = ${userId}
    `

    if (!board[0]) {
      throw new NotFoundException('Board not found')
    }

    const items = await this.prisma.$queryRaw`
      SELECT * FROM "Item"
      WHERE "boardId" = ${boardId}
    `
    return items
  }

  async createItem(userId: string, boardId: string, name: string, columnValues?: Record<string, any>) {
    const board = await this.prisma.$queryRaw`
      SELECT * FROM "Board"
      WHERE "id" = ${boardId} AND "userId" = ${userId}
    `

    if (!board[0]) {
      throw new NotFoundException('Board not found')
    }

    const item = await this.prisma.$queryRaw`
      INSERT INTO "Item" ("id", "mondayId", "boardId", "name", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${'item-' + Date.now()}, ${boardId}, ${name}, NOW(), NOW())
      RETURNING *
    `
    return item[0]
  }
} 