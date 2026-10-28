import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBookmarkDto } from './dto/create-bookmark.dto.js';
import { EditBookmarkDto } from './dto/edit-bookmark.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class BookmarkService {
  constructor(private prisma: PrismaService) {}

  // Shared owner check: 404 when the bookmark doesn't exist, 403 when it isn't yours.
  private async findOwnBookmark(userId: number, bookMarkId: number) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        id: bookMarkId,
      },
    });
    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }
    if (bookmark.userId !== userId) {
      throw new ForbiddenException('Access to resource denied');
    }

    return bookmark;
  }

  getBookmarks(userId: number) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
      },
    });
  }

  getBookmarkById(userId: number, bookMarkId: number) {
    return this.findOwnBookmark(userId, bookMarkId);
  }

  async createBookmark(userId: number, dto: CreateBookmarkDto) {
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        ...dto,
      },
    });
    return bookmark;
  }

  async editBookMarkById(
    userId: number,
    bookMarkId: number,
    dto: EditBookmarkDto,
  ) {
    await this.findOwnBookmark(userId, bookMarkId);

    return this.prisma.bookmark.update({
      where: {
        id: bookMarkId,
      },
      data: {
        ...dto,
      },
    });
  }

  async deleteBookMarkById(userId: number, bookMarkId: number) {
    await this.findOwnBookmark(userId, bookMarkId);

    return this.prisma.bookmark.delete({
      where: {
        id: bookMarkId,
      },
    });
  }
}
