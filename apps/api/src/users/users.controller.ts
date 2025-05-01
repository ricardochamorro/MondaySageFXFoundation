import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: {
    email: string
    password: string
    firstName?: string
    lastName?: string
  }) {
    return this.usersService.create(createUserDto)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id)
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: {
      email?: string
      password?: string
      firstName?: string
      lastName?: string
      mondayToken?: string
      mondayUserId?: string
      mondayAccount?: string
    },
  ) {
    return this.usersService.update(id, updateUserDto)
  }
} 