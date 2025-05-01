import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { UserState } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        mondayAccount: true
      }
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        mondayAccount: true
      }
    })
  }

  async create(data: {
    email: string
    password: string
    name?: string
    state?: UserState
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        state: data.state || UserState.REGISTERED
      },
      include: {
        mondayAccount: true
      }
    })
  }

  async update(id: string, data: any) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        mondayAccount: true
      }
    })
  }
} 