import { ForbiddenException, Injectable, ConflictException } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto.js';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    
    const hash = await argon.hash(dto.password);
    try {
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        firstName: true,
        lastName: true,
      }
    })

    return user;}
    catch (error) {
        if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('Email already exists');
  }
        throw error;
    }
  }
  async signin(dto: AuthDto) {
    const user = await this.prisma.user.findUnique({
    where: { email: dto.email },
  });

    if (!user) {
    throw new ForbiddenException('Credentials incorrect');
  }
  
    const pwMatches = await argon.verify(user.hash, dto.password);

  
    if (!pwMatches) {
    throw new ForbiddenException('Credentials incorrect');
  }


    const { hash, ...rest } = user;
    return rest;

  }
}
