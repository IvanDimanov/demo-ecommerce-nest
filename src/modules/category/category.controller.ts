import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Selectable } from 'kysely';

import type { DB } from '../../common/dto/main-database.dto';
import { MainDatabaseService } from '../main-database/main-database.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import {
  GetCategoriesQuerySchema,
  type GetCategoriesQuery,
} from './dto/get-categories-query.dto';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly mainDatabaseService: MainDatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories from the database' })
  @ApiQuery({
    name: 'select',
    required: false,
    description: 'Array of field names to select. Available fields: id, name',
    type: [String],
    example: ['id', 'name'],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'JSON array of search filters. Each filter can be: { "column": "id", "operation": "=", "value": 1 } or { "column": "name", "operation": "like", "value": "beauty" }',
    type: String,
    example: '[{"column":"name","operation":"like","value":"beauty"}]',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description:
      'JSON array of sort orders. Format: [{"column": "id", "direction": "asc"}] or [{"column": "name", "direction": "desc"}]',
    type: String,
    example: '[{"column":"id","direction":"asc"}]',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (positive integer)',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Number of items per page (positive integer)',
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'The categories have been successfully retrieved.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
                description: 'Category ID',
              },
              name: {
                type: 'string',
                description: 'Category name',
              },
            },
            required: ['id', 'name'],
          },
        },
        total: {
          type: 'number',
          description: 'Total number of categories',
        },
        page: {
          type: 'number',
          description: 'Current page number',
        },
        pageSize: {
          type: 'number',
          description: 'Number of items per page',
        },
        totalPages: {
          type: 'number',
          description: 'Total number of pages',
        },
      },
      required: ['data', 'total', 'page', 'pageSize', 'totalPages'],
    },
  })
  async getCategories(
    @Query(new ZodValidationPipe(GetCategoriesQuerySchema))
    queryDto: GetCategoriesQuery,
  ): Promise<PaginatedResponse<Selectable<DB['category']>>> {
    return this.mainDatabaseService.getCategories(queryDto);
  }
}
