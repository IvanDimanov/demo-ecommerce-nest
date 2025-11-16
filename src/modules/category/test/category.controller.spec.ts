import { Test, TestingModule } from '@nestjs/testing';
import { Selectable } from 'kysely';
import { CategoryController } from '../category.controller';
import { MainDatabaseService } from '../../main-database/main-database.service';
import { GetCategoriesQuery } from '../dto/get-categories-query.dto';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';
import type { DB } from '../../../common/dto/main-database.dto';

describe('CategoryController', () => {
  let controller: CategoryController;
  let mainDatabaseService: MainDatabaseService;
  let getCategoriesMock: jest.Mock;

  const defaultQuery: GetCategoriesQuery = {
    select: ['id', 'name'],
    search: [{ column: 'name', operation: 'like', value: 'beauty' }],
    orderBy: [{ column: 'id', direction: 'asc' }],
    page: 1,
    pageSize: 10,
  };

  const mockCategoriesResponse: PaginatedResponse<Selectable<DB['category']>> =
    {
      data: [
        { id: 1, name: 'Beauty Products' },
        { id: 2, name: 'Beauty Accessories' },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };

  beforeEach(async () => {
    getCategoriesMock = jest.fn().mockResolvedValue(mockCategoriesResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: MainDatabaseService,
          useValue: {
            getCategories: getCategoriesMock,
          },
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
    mainDatabaseService = module.get<MainDatabaseService>(MainDatabaseService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return the categories', async () => {
    const result = await controller.getCategories(defaultQuery);
    expect(result).toBeDefined();
    expect(result).toEqual(mockCategoriesResponse);
  });

  it('should return the categories with the correct structure', async () => {
    const result = await controller.getCategories(defaultQuery);

    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('totalPages');
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should return the categories with the correct fields in data array', async () => {
    const result = await controller.getCategories(defaultQuery);

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('name');
    expect(typeof result.data[0].id).toBe('number');
    expect(typeof result.data[0].name).toBe('string');
  });

  it('should call MainDatabaseService.getCategories with correct parameters', async () => {
    await controller.getCategories(defaultQuery);

    expect(getCategoriesMock).toHaveBeenCalledTimes(1);
    expect(getCategoriesMock).toHaveBeenCalledWith(defaultQuery);
  });

  it('should handle empty results', async () => {
    const emptyResponse: PaginatedResponse<Selectable<DB['category']>> = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    };

    jest
      .spyOn(mainDatabaseService, 'getCategories')
      .mockResolvedValueOnce(emptyResponse);

    const result = await controller.getCategories(defaultQuery);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
  });
});
