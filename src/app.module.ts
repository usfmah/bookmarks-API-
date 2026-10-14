import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { BookmarkModule } from './bookmark/bookmark.module.js';
import { UsersModule } from './users/users.module.js';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';

//TODO: add a config moudle with propper configration from @nestjs/congig
@Module({
  imports: [AuthModule, BookmarkModule, UsersModule, ConfigModule.forRoot({
      isGlobal: true,
    }), PrismaModule,],
  controllers: [],
})
export class AppModule {}
