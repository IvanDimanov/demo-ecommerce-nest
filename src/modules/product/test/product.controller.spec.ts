import { Test, TestingModule } from '@nestjs/testing';
import { Selectable } from 'kysely';
import { ProductController } from '../product.controller';
import { MainDatabaseService } from '../../main-database/main-database.service';
import { ProductSearchService } from '../../search/product-search.service';
import { GetProductsQuery } from '../dto/get-products-query.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import type { DB } from '../../../common/dto/main-database.dto';
import type { ElasticProduct } from '../../../common/dto/elasticsearch.dto';
import type { ProductAggregation } from '../../main-database/dto';

describe('ProductController', () => {
  let controller: ProductController;
  let mainDatabaseService: MainDatabaseService;
  let productSearchService: ProductSearchService;
  let getProductsFromMainDatabaseMock: jest.Mock;
  let getProductsFromElasticsearchMock: jest.Mock;
  let getProductAggregationsMock: jest.Mock;
  let getProductByIdMock: jest.Mock;

  const defaultQuery: GetProductsQuery = {
    select: ['id', 'title', 'price'],
    search: [{ column: 'brand', operation: 'like', value: 'Apple' }],
    orderBy: [{ column: 'id', direction: 'asc' }],
    page: 1,
    pageSize: 10,
  };

  const mockProductsFromMainDatabaseResponse: PaginatedResponse<
    Selectable<DB['product']>
  > = {
    data: [
      {
        id: 1,
        title: 'iPhone 15',
        price: 999,
        brand: 'Apple',
      } as unknown as Selectable<DB['product']>,
      {
        id: 2,
        title: 'MacBook Pro',
        price: 1999,
        brand: 'Apple',
      } as unknown as Selectable<DB['product']>,
    ],
    total: 2,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  const mockProductsFromElasticsearchResponse: PaginatedResponse<ElasticProduct> =
    {
      data: [
        {
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
        },
        {
          id: 2,
          title: 'MacBook Pro',
          description: 'Professional laptop',
          category: 'Electronics',
          tags: ['laptop', 'apple'],
          price: 1999,
          discountPercentage: null,
          rating: 4.8,
          stock: 30,
          availabilityStatus: 'In Stock',
          brand: 'Apple',
          sku: 'MBP-001',
          weight: 1.5,
          warrantyInformation: '2 years warranty',
          shippingInformation: 'Free shipping',
          returnPolicy: '30 days return',
          minimumOrderQuantity: 1,
          thumbnail: 'https://example.com/macbook.jpg',
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

  const mockProductAggregation: ProductAggregation = {
    total: 100,
    category: [
      { name: 'Electronics', productCount: 50 },
      { name: 'Clothing', productCount: 30 },
      { name: 'Home', productCount: 20 },
    ],
    tag: [
      { name: 'popular', productCount: 40 },
      { name: 'new', productCount: 25 },
      { name: 'sale', productCount: 15 },
    ],
    brand: [
      { name: 'Apple', productCount: 20 },
      { name: 'Samsung', productCount: 15 },
      { name: 'Nike', productCount: 10 },
    ],
    availabilityStatus: [
      { name: 'In Stock', productCount: 70 },
      { name: 'Low Stock', productCount: 20 },
      { name: 'Out of Stock', productCount: 10 },
    ],
    price: {
      min: 10,
      max: 5000,
      average: 250,
    },
  };

  const mockProductById: Selectable<DB['product']> = {
    id: 1,
    title: 'iPhone 15',
    price: 999,
    brand: 'Apple',
  } as unknown as Selectable<DB['product']>;

  beforeEach(async () => {
    getProductsFromMainDatabaseMock = jest
      .fn()
      .mockResolvedValue(mockProductsFromMainDatabaseResponse);
    getProductsFromElasticsearchMock = jest
      .fn()
      .mockResolvedValue(mockProductsFromElasticsearchResponse);
    getProductAggregationsMock = jest
      .fn()
      .mockResolvedValue(mockProductAggregation);
    getProductByIdMock = jest.fn().mockResolvedValue(mockProductById);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: MainDatabaseService,
          useValue: {
            getProducts: getProductsFromMainDatabaseMock,
            getProductAggregations: getProductAggregationsMock,
            getProductById: getProductByIdMock,
          },
        },
        {
          provide: ProductSearchService,
          useValue: {
            getProducts: getProductsFromElasticsearchMock,
          },
        },
      ],
    }).compile();

    controller = module.get<ProductController>(ProductController);
    mainDatabaseService = module.get<MainDatabaseService>(MainDatabaseService);
    productSearchService =
      module.get<ProductSearchService>(ProductSearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProductsFromElasticsearch', () => {
    it('should return the products from Elasticsearch', async () => {
      const result =
        await controller.getProductsFromElasticsearch(defaultQuery);
      expect(result).toBeDefined();
      expect(result).toEqual(mockProductsFromElasticsearchResponse);
    });

    it('should return the products with the correct structure', async () => {
      const result =
        await controller.getProductsFromElasticsearch(defaultQuery);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return the products with the correct fields in data array', async () => {
      const result =
        await controller.getProductsFromElasticsearch(defaultQuery);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('price');
      expect(typeof result.data[0].id).toBe('number');
      expect(typeof result.data[0].title).toBe('string');
      expect(typeof result.data[0].price).toBe('number');
    });

    it('should call ProductSearchService.getProducts with correct parameters', async () => {
      await controller.getProductsFromElasticsearch(defaultQuery);

      expect(getProductsFromElasticsearchMock).toHaveBeenCalledTimes(1);
      expect(getProductsFromElasticsearchMock).toHaveBeenCalledWith(
        defaultQuery,
      );
    });

    it('should handle empty results', async () => {
      const emptyResponse: PaginatedResponse<ElasticProduct> = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      jest
        .spyOn(productSearchService, 'getProducts')
        .mockResolvedValueOnce(emptyResponse);

      const result =
        await controller.getProductsFromElasticsearch(defaultQuery);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getProductsFromMainDatabase', () => {
    it('should return the products from main database', async () => {
      const result = await controller.getProductsFromMainDatabase(defaultQuery);
      expect(result).toBeDefined();
      expect(result).toEqual(mockProductsFromMainDatabaseResponse);
    });

    it('should return the products with the correct structure', async () => {
      const result = await controller.getProductsFromMainDatabase(defaultQuery);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should return the products with the correct fields in data array', async () => {
      const result = await controller.getProductsFromMainDatabase(defaultQuery);

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('title');
      expect(result.data[0]).toHaveProperty('price');
      expect(typeof result.data[0].id).toBe('number');
      expect(typeof result.data[0].title).toBe('string');
      expect(typeof result.data[0].price).toBe('number');
    });

    it('should call MainDatabaseService.getProducts with correct parameters', async () => {
      await controller.getProductsFromMainDatabase(defaultQuery);

      expect(getProductsFromMainDatabaseMock).toHaveBeenCalledTimes(1);
      expect(getProductsFromMainDatabaseMock).toHaveBeenCalledWith(
        defaultQuery,
      );
    });

    it('should handle empty results', async () => {
      const emptyResponse: PaginatedResponse<Selectable<DB['product']>> = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      jest
        .spyOn(mainDatabaseService, 'getProducts')
        .mockResolvedValueOnce(emptyResponse);

      const result = await controller.getProductsFromMainDatabase(defaultQuery);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getProductAggregations', () => {
    it('should return the product aggregations', async () => {
      const result = await controller.getProductAggregations();
      expect(result).toBeDefined();
      expect(result).toEqual(mockProductAggregation);
    });

    it('should return the aggregations with the correct structure', async () => {
      const result = await controller.getProductAggregations();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('tag');
      expect(result).toHaveProperty('brand');
      expect(result).toHaveProperty('availabilityStatus');
      expect(result).toHaveProperty('price');
      expect(typeof result.total).toBe('number');
      expect(Array.isArray(result.category)).toBe(true);
      expect(Array.isArray(result.tag)).toBe(true);
      expect(Array.isArray(result.brand)).toBe(true);
      expect(Array.isArray(result.availabilityStatus)).toBe(true);
      expect(typeof result.price).toBe('object');
    });

    it('should return the aggregations with the correct fields', async () => {
      const result = await controller.getProductAggregations();

      expect(result.category[0]).toHaveProperty('name');
      expect(result.category[0]).toHaveProperty('productCount');
      expect(result.tag[0]).toHaveProperty('name');
      expect(result.tag[0]).toHaveProperty('productCount');
      expect(result.brand[0]).toHaveProperty('name');
      expect(result.brand[0]).toHaveProperty('productCount');
      expect(result.availabilityStatus[0]).toHaveProperty('name');
      expect(result.availabilityStatus[0]).toHaveProperty('productCount');
      expect(result.price).toHaveProperty('min');
      expect(result.price).toHaveProperty('max');
      expect(result.price).toHaveProperty('average');
    });

    it('should call MainDatabaseService.getProductAggregations', async () => {
      await controller.getProductAggregations();

      expect(getProductAggregationsMock).toHaveBeenCalledTimes(1);
      expect(getProductAggregationsMock).toHaveBeenCalledWith();
    });
  });

  describe('getProductById', () => {
    const productId = 1;
    const selectFields: readonly (keyof DB['product'])[] = [
      'id',
      'title',
      'price',
    ];

    it('should return a product by ID', async () => {
      const result = await controller.getProductById(productId, selectFields);
      expect(result).toBeDefined();
      expect(result).toEqual(mockProductById);
    });

    it('should return the product with the correct fields', async () => {
      const result = await controller.getProductById(productId, selectFields);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('price');
      expect(typeof result.id).toBe('number');
      expect(typeof result.title).toBe('string');
      expect(typeof result.price).toBe('number');
    });

    it('should call MainDatabaseService.getProductById with correct parameters', async () => {
      await controller.getProductById(productId, selectFields);

      expect(getProductByIdMock).toHaveBeenCalledTimes(1);
      expect(getProductByIdMock).toHaveBeenCalledWith(productId, selectFields);
    });
  });
});
