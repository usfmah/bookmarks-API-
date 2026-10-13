import {Injectable} from '@nestjs/common'
import { AuthDto } from './dto/auth.dto.js';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable ({})

export class AuthService {
    constructor (private prisma: PrismaService) {}

    signup(dto: AuthDto) {
        // TODO: generate the password
        // TODO: save the user in the db

        //TODO: return the hashed password

        return {msg: 'I have signed up'}
    }
    signin() {
        return {msg: 'I have signed in'}
    }
}