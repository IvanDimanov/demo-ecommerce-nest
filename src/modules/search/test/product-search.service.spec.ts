import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ProductSearchService } from '../product-search.service';
import { GetProductsQuery } from '../../product/dto/get-products-query.dto';
import type { ElasticProduct } from '../../../common/dto/elasticsearch.dto';
import type * as es from '@elastic/elasticsearch';

describe('ProductSearchService', () => {
  let service: ProductSearchService;
  let elasticsearchService: ElasticsearchService;
  let searchMock: jest.Mock;

  const mockElasticsearchResponse = (
    hits: Array<{ _source: ElasticProduct | null }>,
    total: number | { value: number },
  ): es.estypes.SearchResponse<ElasticProduct> => {
    return {
      hits: {
        total: total,
        hits: hits.map((hit) => ({
          _source: hit._source,
          _id: '1',
          _index: 'products',
          _score: 1.0,
        })),
      },
    } as es.estypes.SearchResponse<ElasticProduct>;
  };

  const mockProduct: ElasticProduct = {
    id: 1,
    title: 'iPhone 15',
    description: 'Latest iPhone model',
    category: 'Electronics',
    tags: ['smartphone', 'apple'],
    price: 999,
    discountPercentage: 10,
    rating: 4.5,
    stock: 50,
    availabilityStatus: 'In Stock',
    brand: 'Apple',
    sku: 'IPH15-001',
    weight: 0.2,
    warrantyInformation: '1 year warranty',
    shippingInformation: 'Free shipping',
    returnPolicy: '30 days return',
    minimumOrderQuantity: 1,
    thumbnail: 'https://example.com/iphone15.jpg',
  };

  beforeEach(async () => {
    searchMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductSearchService,
        {
          provide: ElasticsearchService,
          useValue: {
            search: searchMock,
            close: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductSearchService>(ProductSearchService);
    elasticsearchService =
      module.get<ElasticsearchService>(ElasticsearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProducts', () => {
    const defaultQuery: GetProductsQuery = {
      select: ['id', 'title', 'price'],
      search: [],
      orderBy: [{ column: 'id', direction: 'asc' }],
      page: 1,
      pageSize: 10,
    };

    it('should return products with correct structure', async () => {
      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should call ElasticsearchService.search with correct parameters', async () => {
      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(defaultQuery);

      expect(searchMock).toHaveBeenCalledTimes(1);
      expect(searchMock).toHaveBeenCalledWith({
        index: 'products',
        _source: defaultQuery.select,
        query: {
          bool: {
            must: [],
            must_not: [],
          },
        },
        sort: [
          {
            id: 'asc',
          },
        ],
        from: 0,
        size: 10,
      });
    });

    it('should handle analyzable fields (category, tags, availabilityStatus) with match query', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [
          { column: 'category', operation: 'like', value: 'Electronics' },
          { column: 'tags', operation: 'like', value: 'smartphone' },
          {
            column: 'availabilityStatus',
            operation: 'like',
            value: 'In Stock',
          },
        ] as GetProductsQuery['search'],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: expect.arrayContaining([
                {
                  match: {
                    category: { query: 'Electronics', operator: 'and' },
                    tags: { query: 'smartphone', operator: 'and' },
                    availabilityStatus: { query: 'In Stock', operator: 'and' },
                  },
                },
              ]),
              must_not: [],
            },
          },
        }),
      );
    });

    it('should handle non-analyzable fields with like operation using wildcard query', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [
          { column: 'brand', operation: 'like', value: 'Apple' },
          { column: 'title', operation: 'like', value: 'iPhone' },
        ] as GetProductsQuery['search'],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: expect.arrayContaining([
                {
                  wildcard: {
                    brand: { value: '*Apple*', case_insensitive: true },
                    title: { value: '*iPhone*', case_insensitive: true },
                  },
                },
              ]),
              must_not: [],
            },
          },
        }),
      );
    });

    it('should handle numeric operations (=, !=, >, >=, <, <=) with range query', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [
          { column: 'price', operation: '>', value: 100 },
          { column: 'price', operation: '<=', value: 1000 },
          { column: 'rating', operation: '>=', value: 4.0 },
        ],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: expect.arrayContaining([
                {
                  range: expect.objectContaining({
                    price: expect.objectContaining({
                      gt: 100,
                      lte: 1000,
                    }),
                    rating: expect.objectContaining({
                      gte: 4.0,
                    }),
                  }),
                },
              ]),
              must_not: [],
            },
          },
        }),
      );
    });

    it('should handle not like operation with must_not wildcard query', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [{ column: 'brand', operation: 'not like', value: 'Samsung' }],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: [],
              must_not: expect.arrayContaining([
                {
                  wildcard: {
                    brand: { value: '*Samsung*', case_insensitive: true },
                  },
                },
              ]),
            },
          },
        }),
      );
    });

    it('should handle combined search filters (analyzable, wildcard, range, not like)', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [
          { column: 'category', operation: 'like', value: 'Electronics' },
          { column: 'brand', operation: 'like', value: 'Apple' },
          { column: 'price', operation: '>', value: 500 },
          { column: 'title', operation: 'not like', value: 'iPad' },
        ],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      const callArgs = searchMock.mock.calls[0][0];
      expect(callArgs.query.bool.must.length).toBeGreaterThan(0);
      expect(callArgs.query.bool.must_not.length).toBeGreaterThan(0);
    });

    it('should handle sorting with orderBy', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        orderBy: [
          { column: 'price', direction: 'desc' },
          { column: 'title', direction: 'asc' },
        ],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sort: [{ price: 'desc' }, { title: 'asc' }],
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        page: 2,
        pageSize: 20,
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 20, // (page - 1) * pageSize = (2 - 1) * 20 = 20
          size: 20,
        }),
      );
    });

    it('should handle field selection with _source', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        select: ['id', 'title', 'price', 'brand'],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          _source: ['id', 'title', 'price', 'brand'],
        }),
      );
    });

    it('should handle total as number format', async () => {
      const response = mockElasticsearchResponse(
        [{ _source: mockProduct }],
        42,
      );
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result.total).toBe(42);
      expect(result.totalPages).toBe(5); // Math.ceil(42 / 10) = 5
    });

    it('should handle total as object with value property', async () => {
      const response = mockElasticsearchResponse([{ _source: mockProduct }], {
        value: 25,
      });
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
    });

    it('should handle total as 0 when format is invalid', async () => {
      const response = {
        hits: {
          total: null,
          hits: [],
        },
      } as unknown as es.estypes.SearchResponse<ElasticProduct>;
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should filter out null or undefined _source from results', async () => {
      const response = mockElasticsearchResponse(
        [
          { _source: mockProduct },
          { _source: null },
          { _source: undefined as unknown as null },
          { _source: { ...mockProduct, id: 2 } },
        ],
        3,
      );
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
    });

    it('should return correct pagination metadata', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        page: 3,
        pageSize: 15,
      };

      const response = mockElasticsearchResponse(
        [{ _source: mockProduct }],
        50,
      );
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(query);

      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(15);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(4); // Math.ceil(50 / 15) = 4
    });

    it('should handle empty search filters', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: {
            bool: {
              must: [],
              must_not: [],
            },
          },
        }),
      );
    });

    it('should handle empty results', async () => {
      const response = mockElasticsearchResponse([], 0);
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle multiple products in response', async () => {
      const products: ElasticProduct[] = [
        mockProduct,
        { ...mockProduct, id: 2, title: 'MacBook Pro' },
        { ...mockProduct, id: 3, title: 'iPad Pro' },
      ];

      const response = mockElasticsearchResponse(
        products.map((p) => ({ _source: p })),
        3,
      );
      searchMock.mockResolvedValue(response);

      const result = await service.getProducts(defaultQuery);

      expect(result.data.length).toBe(3);
      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
      expect(result.data[2].id).toBe(3);
    });

    it('should handle all numeric operations correctly', async () => {
      const operations: Array<{ operation: string; expectedKey: string }> = [
        { operation: '=', expectedKey: 'eq' },
        { operation: '!=', expectedKey: 'ne' },
        { operation: '>', expectedKey: 'gt' },
        { operation: '>=', expectedKey: 'gte' },
        { operation: '<', expectedKey: 'lt' },
        { operation: '<=', expectedKey: 'lte' },
      ];

      for (const { operation, expectedKey } of operations) {
        searchMock.mockClear();

        const query: GetProductsQuery = {
          ...defaultQuery,
          search: [
            { column: 'price', operation: operation as any, value: 100 },
          ],
        };

        const response = mockElasticsearchResponse(
          [{ _source: mockProduct }],
          1,
        );
        searchMock.mockResolvedValue(response);

        await service.getProducts(query);

        const callArgs = searchMock.mock.calls[0][0] as {
          query: {
            bool: {
              must: Array<{
                range?: Record<string, Record<string, number>>;
              }>;
            };
          };
        };
        const rangeQuery = callArgs.query.bool.must.find((q) => q.range);
        expect(rangeQuery).toBeDefined();
        expect(rangeQuery?.range?.price?.[expectedKey]).toBe(100);
      }
    });

    it('should handle mixed analyzable and non-analyzable fields correctly', async () => {
      const query: GetProductsQuery = {
        ...defaultQuery,
        search: [
          { column: 'category', operation: 'like', value: 'Electronics' }, // analyzable
          { column: 'brand', operation: 'like', value: 'Apple' }, // non-analyzable
        ],
      };

      const response = mockElasticsearchResponse([{ _source: mockProduct }], 1);
      searchMock.mockResolvedValue(response);

      await service.getProducts(query);

      const callArgs = searchMock.mock.calls[0][0] as {
        query: {
          bool: {
            must: Array<{
              match?: Record<string, unknown>;
              wildcard?: Record<string, unknown>;
            }>;
          };
        };
      };
      const mustQueries = callArgs.query.bool.must;

      // Should have match query for category
      const matchQuery = mustQueries.find((q) => q.match);
      expect(matchQuery).toBeDefined();
      expect(matchQuery?.match).toBeDefined();

      // Should have wildcard query for brand
      const wildcardQuery = mustQueries.find((q) => q.wildcard);
      expect(wildcardQuery).toBeDefined();
      expect(wildcardQuery?.wildcard).toBeDefined();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close Elasticsearch client', async () => {
      const closeMock = jest.fn().mockResolvedValue(undefined);
      elasticsearchService.close = closeMock;

      await service.onModuleDestroy();

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });
});
