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

  beforeEach(async () => {
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
    await prisma.cleandb();
    pactum.request.setBaseUrl(`http://localhost:${process.env.PORT || 3000}`);
  });


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
          .expectStatus(201);
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
      it('SignedIn', async () => {
        await pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200);
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
      const res = await pactum
        .spec()
        .post('/auth/signup')
        .withBody(dto)
        .expectStatus(201);
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

    it('should reject edit without token', () => {
      return pactum.spec().patch('/users').withBody(editDto).expectStatus(401);
    });
  });

  //TODO: Add test for bookMarks get by Id

 

  // TODO: Add test for create bookMarks
  // TODO: Add test for edit bookmarks
  // TODO: Add test for
  afterEach(async () => {
    await app.close();
  });


  it('connects to the test database', async () => {
    const result = await app.get(PrismaService).$queryRaw`SELECT 1`;
    expect(result).toEqual([{ '?column?': 1 }]);
  });
});
