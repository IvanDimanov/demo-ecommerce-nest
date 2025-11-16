import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('StatusController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/status/ping (GET)', () => {
    it('should return pong with status 200', () => {
      return request(app.getHttpServer())
        .get('/status/ping')
        .expect(200)
        .expect('pong');
    });

    it('should return text/html content type (NestJS default for strings)', () => {
      return request(app.getHttpServer())
        .get('/status/ping')
        .expect(200)
        .expect('Content-Type', /text\/html/);
    });

    it('should return pong as string response', () => {
      return request(app.getHttpServer())
        .get('/status/ping')
        .expect(200)
        .expect((res) => {
          expect(res.text).toBe('pong');
          expect(typeof res.text).toBe('string');
        });
    });
  });
});
