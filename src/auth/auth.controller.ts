import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import {AuthDto} from './dto/auth.dto.js'; 

@Controller()
export class AuthController {
    constructor(private authService: AuthService) {}


    @Post('signup')
    signup(@Body() dto: AuthDto) {
        return this.authService.signup(dto);
    }
    @HttpCode(HttpStatus.OK)
    @Post('signin')
    signin(@Body() dto: AuthDto) {
        return this.authService.signin(dto);
    }
}