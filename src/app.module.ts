import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { BookmarkModule } from './bookmark/bookmark.module.js';
import { UsersModule } from './users/users.module.js';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [AuthModule, BookmarkModule, UsersModule, ConfigModule.forRoot({
      isGlobal: true,
    }),],
  controllers: [],
  providers: [],
})
export class AppModule {}
