import { Module } from "@nestjs/common";
import {JwtModule} from '@nestjs/jwt'
import {AuthController} from './auth.controller.js'
import {AuthService} from './auth.service.js'
import { PrismaModule } from "../prisma/prisma.module.js";
import { JwtStrategy } from "./strategy/jwt.strategy.js";

@Module({
  imports: [PrismaModule, JwtModule.register({
  })],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [],
})

export class AuthModule {}