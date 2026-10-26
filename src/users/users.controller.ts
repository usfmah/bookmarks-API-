import { Controller, Get, UseGuards} from '@nestjs/common';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { GetUser } from '../auth/decorator/get-user.decotrator.js';
import type { User } from '../generated/prisma/client.js'
@UseGuards(JwtGuard)
@Controller('users')

export class UsersController {

    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

}

