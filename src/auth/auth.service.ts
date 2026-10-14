import { Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto.js';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable({})
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(dto: AuthDto) {
    // TODO: TRY CATCH
    const hash = await argon.hash(dto.password);

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
      },
    });
    // TODO: throw exception 403 if no cradentials are provided
    return user;
  }
  signin() {
    //TODO: Find user by email
    //TODO: If the user does not exist throw an exception
    //TODO: compare password
    //TODO: if password is incorrect throw an exception

    //TODO: Send the user back 

    //TODO: Write a script alias to remove, up, restart, migrate database

    return { msg: 'I have signed in' };
  }
}
