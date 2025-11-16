import { Kysely } from 'kysely';
import { MainDatabaseService } from '../main-database.service';
import type { DB } from '../../../common/dto/main-database.dto';
import type { GetAllItemsArgs } from '../dto';
import { Selectable } from 'kysely';

describe('MainDatabaseService', () => {
  let service: MainDatabaseService;
  let mockDb: jest.Mocked<Kysely<DB>>;
  let mockQueryBuilder: any;

  const createMockQueryBuilder = () => {
    const builder: any = {
      selectFrom: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      $if: jest.fn((condition: boolean, callback: (qb: any) => any) => {
        if (condition) {
          return callback(builder);
        }
        return builder;
      }),
      execute: jest.fn(),
      executeTakeFirstOrThrow: jest.fn(),
    };
    return builder as unknown as jest.Mocked<Kysely<DB>>;
  };

  beforeEach(() => {
    mockQueryBuilder = createMockQueryBuilder();
    mockDb = {
      selectFrom: jest.fn().mockReturnValue(mockQueryBuilder),
      destroy: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Kysely<DB>>;

    // Directly instantiate service with mocked database
    // since @injectKysely() uses a custom decorator that's hard to mock in tests
    service = new MainDatabaseService(mockDb as Kysely<DB>);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleDestroy', () => {
    it('should close Kysely database connection', async () => {
      await service.onModuleDestroy();

      expect(mockDb.destroy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategories', () => {
    const mockCategory: Selectable<DB['category']> = {
      id: 1,
      name: 'Electronics',
    } as Selectable<DB['category']>;

    it('should return categories with default parameters', async () => {
      const mockData = [mockCategory];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      const result = await service.getCategories({});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result).toHaveProperty('totalPages');
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should apply search filters with text operations (like)', async () => {
      const args: GetAllItemsArgs = {
        search: [{ column: 'name', operation: 'like', value: 'Electronics' }],
      };

      const mockData = [mockCategory];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getCategories(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should apply search filters with numeric operations', async () => {
      const args: GetAllItemsArgs = {
        search: [{ column: 'id', operation: '>', value: 5 }],
      };

      const mockData = [mockCategory];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getCategories(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should apply custom select fields', async () => {
      const args: GetAllItemsArgs = {
        select: ['id', 'name'],
      };

      const mockData = [mockCategory];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getCategories(args);

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(['id', 'name']);
    });

    it('should apply sorting', async () => {
      const args: GetAllItemsArgs = {
        orderBy: [{ column: 'name', direction: 'desc' }],
      };

      const mockData = [mockCategory];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getCategories(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      const args: GetAllItemsArgs = {
        page: 2,
        pageSize: 20,
      };

      const mockData = [mockCategory];
      const mockCount = { total: 50 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      const result = await service.getCategories(args);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(20); // (page - 1) * pageSize
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(3); // Math.ceil(50 / 20) = 3
    });

    it('should handle empty results', async () => {
      const mockData: Selectable<DB['category']>[] = [];
      const mockCount = { total: 0 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      const result = await service.getCategories({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle multiple search filters', async () => {
      const args: GetAllItemsArgs = {
        search: [
          { column: 'name', operation: 'like', value: 'Electronics' },
          { column: 'id', operation: '>', value: 0 },
        ],
      };

      const mockData = [mockCategory];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getCategories(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
    });
  });

  describe('getProductById', () => {
    const mockProduct = {
      id: 1,
      title: 'iPhone 15',
      price: 999,
      brand: 'Apple',
    } as unknown as Selectable<DB['product']>;

    it('should return a product by ID with default select', async () => {
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockProduct);

      const result = await service.getProductById(1);

      expect(result).toEqual(mockProduct);
      expect(mockDb.selectFrom).toHaveBeenCalledWith('product');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('product.id', '=', 1);
    });

    it('should return a product with custom select fields', async () => {
      const select = ['id', 'title', 'price'];
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockProduct);

      await service.getProductById(1, select);

      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });

    it('should join tags table when tags is in select', async () => {
      const select = ['id', 'title', 'tags'];
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        ...mockProduct,
        tags: ['smartphone', 'apple'],
      });

      await service.getProductById(1, select);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.groupBy).toHaveBeenCalled();
    });

    it('should join category table when category is in select', async () => {
      const select = ['id', 'title', 'category'];
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        ...mockProduct,
        category: 'Electronics',
      });

      await service.getProductById(1, select);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.groupBy).toHaveBeenCalled();
    });

    it('should join both tags and category when both are in select', async () => {
      const select = ['id', 'title', 'tags', 'category'];
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        ...mockProduct,
        tags: ['smartphone'],
        category: 'Electronics',
      });

      await service.getProductById(1, select);

      expect(mockQueryBuilder.$if).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
    });

    it('should filter out tags and category from productSelect', async () => {
      const select = ['id', 'title', 'tags', 'category', 'price'];
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockProduct);

      await service.getProductById(1, select);

      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });
  });

  describe('getProducts', () => {
    const mockProduct = {
      id: 1,
      title: 'iPhone 15',
      price: 999,
      brand: 'Apple',
    } as unknown as Selectable<DB['product']>;

    it('should return products with default parameters', async () => {
      const mockData = [mockProduct];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      const result = await service.getProducts({});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result.data).toEqual(mockData);
      expect(result.total).toBe(1);
    });

    it('should apply search filters with text operations', async () => {
      const args: GetAllItemsArgs = {
        search: [{ column: 'brand', operation: 'like', value: 'Apple' }],
      };

      const mockData = [mockProduct];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should apply search filters with numeric operations', async () => {
      const args: GetAllItemsArgs = {
        search: [{ column: 'price', operation: '>', value: 500 }],
      };

      const mockData = [mockProduct];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should join tags table when tags is in select', async () => {
      const args: GetAllItemsArgs = {
        select: ['id', 'title', 'tags'],
      };

      const mockData = [{ ...mockProduct, tags: ['smartphone'] }];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.groupBy).toHaveBeenCalled();
    });

    it('should join category table when category is in select', async () => {
      const args: GetAllItemsArgs = {
        select: ['id', 'title', 'category'],
      };

      const mockData = [{ ...mockProduct, category: 'Electronics' }];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.groupBy).toHaveBeenCalled();
    });

    it('should apply sorting', async () => {
      const args: GetAllItemsArgs = {
        orderBy: [{ column: 'price', direction: 'desc' }],
      };

      const mockData = [mockProduct];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      const args: GetAllItemsArgs = {
        page: 3,
        pageSize: 15,
      };

      const mockData = [mockProduct];
      const mockCount = { total: 50 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      const result = await service.getProducts(args);

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(15);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(30); // (3 - 1) * 15 = 30
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(15);
      expect(result.totalPages).toBe(4); // Math.ceil(50 / 15) = 4
    });

    it('should handle empty results', async () => {
      const mockData: Selectable<DB['product']>[] = [];
      const mockCount = { total: 0 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      const result = await service.getProducts({});

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle multiple search filters', async () => {
      const args: GetAllItemsArgs = {
        search: [
          { column: 'brand', operation: 'like', value: 'Apple' },
          { column: 'price', operation: '>', value: 500 },
        ],
      };

      const mockData = [mockProduct];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.$if).toHaveBeenCalled();
    });

    it('should filter out tags and category from productSelect', async () => {
      const args: GetAllItemsArgs = {
        select: ['id', 'title', 'tags', 'category', 'price'],
      };

      const mockData = [mockProduct];
      const mockCount = { total: 1 };

      mockQueryBuilder.execute.mockResolvedValue(mockData);
      mockQueryBuilder.executeTakeFirstOrThrow.mockResolvedValue(mockCount);

      await service.getProducts(args);

      expect(mockQueryBuilder.select).toHaveBeenCalled();
    });
  });

  describe('getProductAggregations', () => {
    beforeEach(() => {
      // Reset query builder for each aggregation test
      mockQueryBuilder = createMockQueryBuilder();
      mockDb.selectFrom = jest.fn().mockReturnValue(mockQueryBuilder);
    });

    it('should return product aggregations with correct structure', async () => {
      // Mock total count
      const totalCountBuilder = createMockQueryBuilder();
      totalCountBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        total: 100,
      });
      mockDb.selectFrom = jest
        .fn()
        .mockReturnValueOnce(totalCountBuilder) // For total count
        .mockReturnValue(mockQueryBuilder);

      // Mock tag aggregations
      mockQueryBuilder.execute.mockResolvedValueOnce([
        { name: 'popular', productCount: 40 },
        { name: 'new', productCount: 25 },
        { name: 'sale', productCount: 15 },
      ]);

      // Mock category aggregations
      mockQueryBuilder.execute.mockResolvedValueOnce([
        { name: 'Electronics', productCount: 50 },
        { name: 'Clothing', productCount: 30 },
        { name: 'Home', productCount: 20 },
      ]);

      // Mock brand aggregations
      mockQueryBuilder.execute.mockResolvedValueOnce([
        { name: 'Apple', productCount: 20 },
        { name: 'Samsung', productCount: 15 },
        { name: 'Nike', productCount: 10 },
      ]);

      // Mock availability status aggregations
      mockQueryBuilder.execute.mockResolvedValueOnce([
        { name: 'In Stock', productCount: 70 },
        { name: 'Low Stock', productCount: 20 },
        { name: 'Out of Stock', productCount: 10 },
      ]);

      // Mock price aggregations
      const priceBuilder = createMockQueryBuilder();
      priceBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        minPrice: 10,
        maxPrice: 5000,
        averagePrice: 250,
      });
      mockDb.selectFrom = jest
        .fn()
        .mockReturnValueOnce(totalCountBuilder)
        .mockReturnValueOnce(mockQueryBuilder) // tag
        .mockReturnValueOnce(mockQueryBuilder) // category
        .mockReturnValueOnce(mockQueryBuilder) // brand
        .mockReturnValueOnce(mockQueryBuilder) // availabilityStatus
        .mockReturnValueOnce(priceBuilder); // price

      const result = await service.getProductAggregations();

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('tag');
      expect(result).toHaveProperty('brand');
      expect(result).toHaveProperty('availabilityStatus');
      expect(result).toHaveProperty('price');
      expect(result.total).toBe(100);
      expect(Array.isArray(result.category)).toBe(true);
      expect(Array.isArray(result.tag)).toBe(true);
      expect(Array.isArray(result.brand)).toBe(true);
      expect(Array.isArray(result.availabilityStatus)).toBe(true);
      expect(typeof result.price).toBe('object');
    });

    it('should return aggregations with correct fields', async () => {
      const totalCountBuilder = createMockQueryBuilder();
      totalCountBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        total: 10,
      });

      mockQueryBuilder.execute
        .mockResolvedValueOnce([{ name: 'tag1', productCount: 5 }])
        .mockResolvedValueOnce([{ name: 'cat1', productCount: 3 }])
        .mockResolvedValueOnce([{ name: 'brand1', productCount: 2 }])
        .mockResolvedValueOnce([{ name: 'In Stock', productCount: 8 }]);

      const priceBuilder = createMockQueryBuilder();
      priceBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        minPrice: 10,
        maxPrice: 100,
        averagePrice: 50,
      });

      mockDb.selectFrom = jest
        .fn()
        .mockReturnValueOnce(totalCountBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(priceBuilder);

      const result = await service.getProductAggregations();

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

    it('should sort tag aggregations by productCount descending', async () => {
      const totalCountBuilder = createMockQueryBuilder();
      totalCountBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        total: 10,
      });

      mockQueryBuilder.execute
        .mockResolvedValueOnce([
          { name: 'tag2', productCount: 3 },
          { name: 'tag1', productCount: 5 },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const priceBuilder = createMockQueryBuilder();
      priceBuilder.executeTakeFirstOrThrow.mockResolvedValue({
        minPrice: 10,
        maxPrice: 100,
        averagePrice: 50,
      });

      mockDb.selectFrom = jest
        .fn()
        .mockReturnValueOnce(totalCountBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(priceBuilder);

      const result = await service.getProductAggregations();

      expect(result.tag[0].productCount).toBeGreaterThanOrEqual(
        result.tag[1]?.productCount || 0,
      );
    });
  });
});
