import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('ProductController (e2e)', () => {
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

  describe('/products (GET) - Elasticsearch', () => {
    it('should return products from Elasticsearch with default parameters', () => {
      return request(app.getHttpServer())
        .get('/products')
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

    it('should return products with correct response structure', () => {
      return request(app.getHttpServer())
        .get('/products')
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
        .get('/products')
        .query({ select: '["id", "title", "price"]' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          if (res.body.data.length > 0) {
            const product = res.body.data[0];
            expect(product).toHaveProperty('id');
            expect(product).toHaveProperty('title');
            expect(product).toHaveProperty('price');
          }
        });
    });

    it('should accept search parameter with text operation (like)', () => {
      const searchQuery = JSON.stringify([
        { column: 'brand', operation: 'like', value: 'Apple' },
      ]);

      return request(app.getHttpServer())
        .get('/products')
        .query({ search: searchQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept search parameter with numeric operation (>)', () => {
      const searchQuery = JSON.stringify([
        { column: 'price', operation: '>', value: 100 },
      ]);

      return request(app.getHttpServer())
        .get('/products')
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
        .get('/products')
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

    it('should accept pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/products')
        .query({ page: 2, pageSize: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(2);
          expect(res.body.pageSize).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
          expect(res.body.totalPages).toBe(
            Math.ceil(res.body.total / res.body.pageSize),
          );
        });
    });

    it('should return JSON content type', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect('Content-Type', /json/);
    });
  });

  describe('/products/from-main-database (GET)', () => {
    it('should return products from main database with default parameters', () => {
      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('pageSize');
          expect(res.body).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept select parameter', () => {
      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .query({ select: '["id", "title", "price"]' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          if (res.body.data.length > 0) {
            const product = res.body.data[0];
            expect(product).toHaveProperty('id');
          }
        });
    });

    it('should accept search parameter with text operation', () => {
      const searchQuery = JSON.stringify([
        { column: 'brand', operation: 'like', value: 'Apple' },
      ]);

      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .query({ search: searchQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept search parameter with numeric operation', () => {
      const searchQuery = JSON.stringify([
        { column: 'price', operation: '>', value: 500 },
      ]);

      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .query({ search: searchQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should accept orderBy parameter', () => {
      const orderByQuery = JSON.stringify([
        { column: 'price', direction: 'desc' },
      ]);

      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .query({ orderBy: orderByQuery })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
        });
    });

    it('should accept pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .query({ page: 1, pageSize: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.pageSize).toBe(10);
          expect(res.body.data.length).toBeLessThanOrEqual(10);
        });
    });

    it('should accept combined query parameters', () => {
      const searchQuery = JSON.stringify([
        { column: 'brand', operation: 'like', value: 'Apple' },
      ]);
      const orderByQuery = JSON.stringify([
        { column: 'price', direction: 'desc' },
      ]);

      return request(app.getHttpServer())
        .get('/products/from-main-database')
        .query({
          select: '["id", "title", "price"]',
          search: searchQuery,
          orderBy: orderByQuery,
          page: 1,
          pageSize: 5,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.page).toBe(1);
          expect(res.body.pageSize).toBe(5);
        });
    });
  });

  describe('/products/aggs (GET)', () => {
    it('should return product aggregations with correct structure', () => {
      return request(app.getHttpServer())
        .get('/products/aggs')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('tag');
          expect(res.body).toHaveProperty('category');
          expect(res.body).toHaveProperty('brand');
          expect(res.body).toHaveProperty('availabilityStatus');
          expect(res.body).toHaveProperty('price');
          expect(typeof res.body.total).toBe('number');
          expect(Array.isArray(res.body.tag)).toBe(true);
          expect(Array.isArray(res.body.category)).toBe(true);
          expect(Array.isArray(res.body.brand)).toBe(true);
          expect(Array.isArray(res.body.availabilityStatus)).toBe(true);
          expect(typeof res.body.price).toBe('object');
        });
    });

    it('should return aggregations with correct fields', () => {
      return request(app.getHttpServer())
        .get('/products/aggs')
        .expect(200)
        .expect((res) => {
          if (res.body.tag.length > 0) {
            expect(res.body.tag[0]).toHaveProperty('name');
            expect(res.body.tag[0]).toHaveProperty('productCount');
            expect(typeof res.body.tag[0].name).toBe('string');
            expect(typeof res.body.tag[0].productCount).toBe('number');
          }
          if (res.body.category.length > 0) {
            expect(res.body.category[0]).toHaveProperty('name');
            expect(res.body.category[0]).toHaveProperty('productCount');
          }
          if (res.body.brand.length > 0) {
            expect(res.body.brand[0]).toHaveProperty('name');
            expect(res.body.brand[0]).toHaveProperty('productCount');
          }
          if (res.body.availabilityStatus.length > 0) {
            expect(res.body.availabilityStatus[0]).toHaveProperty('name');
            expect(res.body.availabilityStatus[0]).toHaveProperty(
              'productCount',
            );
          }
          expect(res.body.price).toHaveProperty('min');
          expect(res.body.price).toHaveProperty('max');
          expect(res.body.price).toHaveProperty('average');
          expect(typeof res.body.price.min).toBe('number');
          expect(typeof res.body.price.max).toBe('number');
          expect(typeof res.body.price.average).toBe('number');
        });
    });

    it('should return JSON content type', () => {
      return request(app.getHttpServer())
        .get('/products/aggs')
        .expect(200)
        .expect('Content-Type', /json/);
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return a product by ID with default select', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).toBe(1);
          expect(typeof res.body.id).toBe('number');
        });
    });

    it('should return a product with custom select fields', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .query({ select: '["id", "title", "price"]' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('price');
          expect(typeof res.body.id).toBe('number');
          expect(typeof res.body.title).toBe('string');
          expect(typeof res.body.price).toBe('string');
        });
    });

    it('should return a product with tags when tags is in select', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .query({ select: '["id", "title", "tags"]' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('tags');
          expect(Array.isArray(res.body.tags)).toBe(true);
        });
    });

    it('should return a product with category when category is in select', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .query({ select: '["id", "title", "category"]' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title');
          expect(res.body).toHaveProperty('category');
        });
    });

    it('should return 400 for invalid product ID (non-positive)', () => {
      return request(app.getHttpServer()).get('/products/0').expect(400);
    });

    it('should return 400 for invalid product ID (negative)', () => {
      return request(app.getHttpServer()).get('/products/-1').expect(400);
    });

    it('should return 400 for non-numeric product ID', () => {
      return request(app.getHttpServer()).get('/products/abc').expect(400);
    });

    it('should return JSON content type', () => {
      return request(app.getHttpServer())
        .get('/products/1')
        .expect(200)
        .expect('Content-Type', /json/);
    });
  });
});
