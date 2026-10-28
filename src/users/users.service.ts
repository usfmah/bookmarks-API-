import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EditUserDto } from './dto/user.dto.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async editUser(userId: number, dto: EditUserDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: { hash: true },
    });
  }
}
