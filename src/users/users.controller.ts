import { Controller, Get, UseGuards, Patch, Body} from '@nestjs/common';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { GetUser } from '../auth/decorator/get-user.decotrator.js';
import type { User } from '../generated/prisma/client.js'
import { EditUserDto } from './dto/user.dto.js';
import { UsersService } from './users.service.js';
@UseGuards(JwtGuard)
@Controller('users')

export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

    @Patch()
    editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
        return this.usersService.editUser(userId, dto);
    }

}

