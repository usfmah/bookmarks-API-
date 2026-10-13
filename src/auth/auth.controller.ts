import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import {AuthDto} from './dto/auth.dto.js'; 

@Controller()
export class AuthController {
    constructor(private authService: AuthService) {}


    @Post('signup')
    signup(@Body() dto: AuthDto) {
        return this.authService.signup(dto);
    }

    @Post('signin')
    signin() {
        return this.authService.signin();
    }
}