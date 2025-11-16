import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('CategoryController (e2e)', () => {
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

  describe('/categories (GET)', () => {
    it('should return categories with default parameters', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('pageSize');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(typeof res.body.total).toBe('number');
          expect(typeof res.body.page).toBe('number');
          expect(typeof res.body.pageSize).toBe('number');
          expect(typeof res.body.totalPages).toBe('number');
        });
    });

    it('should return categories with correct response structure', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBeGreaterThanOrEqual(1);
          expect(res.body.pageSize).toBeGreaterThanOrEqual(1);
          expect(res.body.total).toBeGreaterThanOrEqual(0);
          expect(res.body.totalPages).toBeGreaterThanOrEqual(0);
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty('id');
            expect(typeof res.body.data[0].id).toBe('number');
          }
        });
    });

    it('should accept select parameter to filter fields', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .query({ select: ['id', 'name'] })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          if (res.body.data.length > 0) {
            const category = res.body.data[0];
            expect(category).toHaveProperty('id');
            expect(category).toHaveProperty('name');
          }
        });
    });

    it('should accept select parameter with single field', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .query({ select: '["id"]' }) // Sending string instead of Object coz of parsing quirk
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          if (res.body.data.length > 0) {
            const category = res.body.data[0];
            expect(category).toHaveProperty('id');
          }
        });
    });

    it('should accept search parameter with text operation (like)', () => {
      const searchQuery = JSON.stringify([
        { column: 'name', operation: 'like', value: 'beauty' },
      ]);

      return request(app.getHttpServer())
        .get('/categories')
        .query({ search: searchQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept search parameter with numeric operation (=)', () => {
      const searchQuery = JSON.stringify([
        { column: 'id', operation: '=', value: 1 },
      ]);

      return request(app.getHttpServer())
        .get('/categories')
        .query({ search: searchQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept orderBy parameter for sorting', () => {
      const orderByQuery = JSON.stringify([{ column: 'id', direction: 'asc' }]);

      return request(app.getHttpServer())
        .get('/categories')
        .query({ orderBy: orderByQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          if (res.body.data.length > 1) {
            expect(res.body.data[0].id).toBeLessThanOrEqual(
              res.body.data[1].id,
            );
          }
        });
    });

    it('should accept orderBy parameter with descending direction', () => {
      const orderByQuery = JSON.stringify([
        { column: 'name', direction: 'desc' },
      ]);

      return request(app.getHttpServer())
        .get('/categories')
        .query({ orderBy: orderByQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should accept page parameter for pagination', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .query({ page: 1 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
        });
    });

    it('should accept pageSize parameter for pagination', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .query({ pageSize: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.pageSize).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should handle pagination correctly', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .query({ page: 2, pageSize: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(2);
          expect(res.body.pageSize).toBe(10);
          expect(res.body.totalPages).toBe(
            Math.ceil(res.body.total / res.body.pageSize),
          );
        });
    });

    it('should accept combined query parameters', () => {
      const searchQuery = JSON.stringify([
        { column: 'name', operation: 'like', value: 'beauty' },
      ]);
      const orderByQuery = JSON.stringify([{ column: 'id', direction: 'asc' }]);

      return request(app.getHttpServer())
        .get('/categories')
        .query({
          select: ['id', 'name'],
          search: searchQuery,
          orderBy: orderByQuery,
          page: 1,
          pageSize: 10,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.page).toBe(1);
          expect(res.body.pageSize).toBe(10);
        });
    });

    it('should return JSON content type', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect('Content-Type', /json/);
    });

    it('should handle empty results gracefully', () => {
      const searchQuery = JSON.stringify([
        {
          column: 'name',
          operation: 'like',
          value: 'nonexistentcategory12345',
        },
      ]);

      return request(app.getHttpServer())
        .get('/categories')
        .query({ search: searchQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toEqual([]);
          expect(res.body.total).toBe(0);
          expect(res.body.totalPages).toBe(0);
        });
    });
  });
});
