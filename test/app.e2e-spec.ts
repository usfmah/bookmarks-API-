import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as pactum from 'pactum';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const dto = {
    email: 'usfmah@gmail.com',
    password: '123',
  };

  // Reusable helpers
  const signinSpec = (credentials: { email: string; password: string }) =>
    pactum.spec().post('/auth/signin').withBody(credentials).expectStatus(200);

  const authHeader = { Authorization: 'Bearer $S{userAt}' };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
    await app.listen(parseInt(process.env.PORT!) || 3000);
    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl(`http://localhost:${process.env.PORT || 3000}`);
  }, 60000);

  describe('Auth', () => {
    describe('signup', () => {
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('should throw if password & email are empty', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('SignedUp', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .stores('userAt', 'access_token');
      });
    });

    describe('signin', () => {
      it('should throw if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('should throw if password & email are empty', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });
      it('SignedIn', () => {
        return signinSpec(dto).stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    const editDto = {
      email: 'edited@gmail.com',
      firstName: 'Soofa',
      lastName: 'Dev',
    };
    let accessToken: string;

    beforeEach(async () => {
      const res = await signinSpec(dto);
      accessToken = res.body.access_token;
    });

    it('should get current user with access token', () => {
      return pactum
        .spec()
        .get('/users/me')
        .withHeaders({ Authorization: `Bearer ${accessToken}` })
        .expectStatus(200)
        .expectBodyContains(dto.email);
    });

    it('should reject /users/me without token', () => {
      return pactum.spec().get('/users/me').expectStatus(401);
    });

    it('should reject /users/me with a malformed token', () => {
      return pactum
        .spec()
        .get('/users/me')
        .withHeaders({ Authorization: 'Bearer not.a.jwt' })
        .expectStatus(401);
    });

    it('should reject /users/me with a token signed by the wrong secret', async () => {
      const jwt = app.get(JwtService);
      const badToken = await jwt.signAsync(
        { sub: 1, email: dto.email },
        { secret: 'not-the-real-secret', expiresIn: '15m' },
      );
      return pactum
        .spec()
        .get('/users/me')
        .withHeaders({ Authorization: `Bearer ${badToken}` })
        .expectStatus(401);
    });

    it('should reject edit without token', () => {
      return pactum.spec().patch('/users').withBody(editDto).expectStatus(401);
    });

    it('should edit user with access token', () => {
      return pactum
        .spec()
        .patch('/users')
        .withHeaders({ Authorization: `Bearer ${accessToken}` })
        .withBody(editDto)
        .expectStatus(200)
        .expectBodyContains(editDto.firstName)
        .expectBodyContains(editDto.email);
    });
  });

  describe('bookmark', () => {
    describe('Get empty bookmark', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders(authHeader)
          .expectStatus(200)
          .expectBody([]);
      });
    });
    describe('Create Bookmark', () => {
      const dto = {
        title: 'usfmah@gmail.com',
        link: 'https://www.youtube.com',
      };

      it('should create bookmarks', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders(authHeader)
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id');
      });
    });
    describe('Get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders(authHeader)
          .expectStatus(200)
          .expectBodyContains('https://www.youtube.com');
      });
    });
    describe('Get bookmark by id', () => {
      it('should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders(authHeader)
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}');
      });
    });
    describe('Edit bookmark by id', () => {
      const dto = {
        title: 'Change title',
        description: 'My bookmark changed.',
      };

      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders(authHeader)
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title);
      });
    });
    describe('Delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders(authHeader)
          .expectStatus(204);
      });
    });

    describe('Unhappy paths', () => {
      describe('401 without token', () => {
        it('should reject GET without token', () => {
          return pactum.spec().get('/bookmarks').expectStatus(401);
        });
        it('should reject GET by id without token', () => {
          return pactum.spec().get('/bookmarks/1').expectStatus(401);
        });
        it('should reject POST without token', () => {
          return pactum.spec().post('/bookmarks').expectStatus(401);
        });
        it('should reject PATCH without token', () => {
          return pactum.spec().patch('/bookmarks/1').expectStatus(401);
        });
        it('should reject DELETE without token', () => {
          return pactum.spec().delete('/bookmarks/1').expectStatus(401);
        });
      });

      describe('404 when bookmark does not exist', () => {
        it('should reject GET by nonexistent id', () => {
          return pactum
            .spec()
            .get('/bookmarks/99999')
            .withHeaders(authHeader)
            .expectStatus(404);
        });
        it('should reject EDIT for nonexistent id', () => {
          return pactum
            .spec()
            .patch('/bookmarks/99999')
            .withHeaders(authHeader)
            .withBody({ title: 'nope' })
            .expectStatus(404);
        });
        it('should reject DELETE for nonexistent id', () => {
          return pactum
            .spec()
            .delete('/bookmarks/99999')
            .withHeaders(authHeader)
            .expectStatus(404);
        });
      });

      describe('403 when bookmark belongs to another user', () => {
        const otherAuthHeader = { Authorization: 'Bearer $S{otherUserAt}' };

        it('should sign up another user', () => {
          return pactum
            .spec()
            .post('/auth/signup')
            .withBody({ email: 'other@gmail.com', password: '123' })
            .expectStatus(201)
            .stores('otherUserAt', 'access_token');
        });
        it('should create a bookmark as the owner first', () => {
          return pactum
            .spec()
            .post('/bookmarks')
            .withHeaders(authHeader)
            .withBody({ title: 'Owned', link: 'https://www.google.com' })
            .expectStatus(201)
            .stores('targetBookmarkId', 'id');
        });
        it("should reject GET of another user's bookmark", () => {
          return pactum
            .spec()
            .get('/bookmarks/{id}')
            .withPathParams('id', '$S{targetBookmarkId}')
            .withHeaders(otherAuthHeader)
            .expectStatus(403);
        });
        it("should reject EDIT of another user's bookmark", () => {
          return pactum
            .spec()
            .patch('/bookmarks/{id}')
            .withPathParams('id', '$S{targetBookmarkId}')
            .withHeaders(otherAuthHeader)
            .withBody({ title: 'hacked' })
            .expectStatus(403);
        });
        it("should reject DELETE of another user's bookmark", () => {
          return pactum
            .spec()
            .delete('/bookmarks/{id}')
            .withPathParams('id', '$S{targetBookmarkId}')
            .withHeaders(otherAuthHeader)
            .expectStatus(403);
        });
      });

      describe('400 when id is not a number', () => {
        it('should reject GET by non-numeric id', () => {
          return pactum
            .spec()
            .get('/bookmarks/abc')
            .withHeaders(authHeader)
            .expectStatus(400);
        });
        it('should reject EDIT for non-numeric id', () => {
          return pactum
            .spec()
            .patch('/bookmarks/abc')
            .withHeaders(authHeader)
            .withBody({ title: 'nope' })
            .expectStatus(400);
        });
      });

      describe('400 when create body is invalid', () => {
        it('should throw if title is empty', () => {
          return pactum
            .spec()
            .post('/bookmarks')
            .withHeaders(authHeader)
            .withBody({ link: 'https://www.youtube.com' })
            .expectStatus(400);
        });
        it('should throw if link is empty', () => {
          return pactum
            .spec()
            .post('/bookmarks')
            .withHeaders(authHeader)
            .withBody({ title: 'Youtube' })
            .expectStatus(400);
        });
      });
    });
  });
  afterAll(async () => {
    await app.close();
  });

  it('connects to the test database', async () => {
    const result = await app.get(PrismaService).$queryRaw`SELECT 1`;
    expect(result).toEqual([{ '?column?': 1 }]);
  });
});
