import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseIntPipe,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { BookmarkService } from './bookmark.service.js';
import { JwtGuard } from '../auth/guard/jwt.guard.js';
import { GetUser } from '../auth/decorator/get-user.decorator.js';
import { CreateBookmarkDto } from './dto/create-bookmark.dto.js';
import { EditBookmarkDto } from './dto/edit-bookmark.dto.js';
@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private bookmarkService: BookmarkService) {}

  @Get()
  getBookmarks(@GetUser('id') userId: number) {
    return this.bookmarkService.getBookmarks(userId);
  }

  @Get(':id')
  getBookmarkById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) bookMarkId: number,
  ) {
    return this.bookmarkService.getBookmarkById(userId, bookMarkId);
  }

  @Post()
  createBookmark(
    @GetUser('id') userId: number,
    @Body() dto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.createBookmark(userId, dto);
  }

  @Patch(':id')
  editBookMarkById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) bookMarkId: number,
    @Body() dto: EditBookmarkDto,
  ) {
    return this.bookmarkService.editBookMarkById(userId, bookMarkId, dto);
  }
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteBookMarkById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) bookMarkId: number,
  ) {
    return this.bookmarkService.deleteBookMarkById(userId, bookMarkId);
  }
}
