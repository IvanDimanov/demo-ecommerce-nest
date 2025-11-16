import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Selectable } from 'kysely';
import { z } from 'zod';

import type { DB } from '../../common/dto/main-database.dto';
import type { ElasticProduct } from '../../common/dto/elasticsearch.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ParsePositiveIntPipe } from '../../common/pipes/parse-positive-int.pipe';
import { parseSelect } from '../../common/pipes/zod-parse-select';
import { MainDatabaseService } from '../main-database/main-database.service';
import { ProductSearchService } from '../search/product-search.service';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { DEFAULT_PRODUCT_SELECT, AVAILABLE_PRODUCT_SELECT } from './constants';
import {
  GetProductsQuerySchema,
  type GetProductsQuery,
} from './dto/get-products-query.dto';
import type { ProductAggregation } from '../main-database/dto';

const defaultSelectPipe = new ZodValidationPipe(
  parseSelect({
    selectNames: z.enum(AVAILABLE_PRODUCT_SELECT),
    defaultSelect: DEFAULT_PRODUCT_SELECT as unknown as string[],
  }),
);

@ApiTags('Product')
@Controller('products')
export class ProductController {
  constructor(
    private readonly mainDatabaseService: MainDatabaseService,
    private readonly productSearchService: ProductSearchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get products from Elasticsearch' })
  @ApiQuery({
    name: 'select',
    required: false,
    description:
      'Array of field names to select. Available fields: id, title, description, category, tags, price, discountPercentage, rating, stock, availabilityStatus, brand, sku, weight, warrantyInformation, shippingInformation, returnPolicy, minimumOrderQuantity, thumbnail',
    type: [String],
    example: [
      'id',
      'title',
      'description',
      'category',
      'tags',
      'price',
      'discountPercentage',
      'rating',
      'stock',
      'availabilityStatus',
      'brand',
      'sku',
      'weight',
      'warrantyInformation',
      'shippingInformation',
      'returnPolicy',
      'minimumOrderQuantity',
      'thumbnail',
    ],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'JSON array of search filters. Each filter can be: { "column": "brand", "operation": "like", "value": "Apple" } or { "column": "price", "operation": ">", "value": 50 } or ',
    type: String,
    example: '[{"column":"brand","operation":"like","value":"Apple"}]',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description:
      'JSON array of sort orders. Format: [{"column": "id", "direction": "asc"}] or [{"column": "brand", "direction": "desc"}]',
    type: String,
    example: '[{"column":"brand","direction":"desc"}]',
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
    description: 'The products have been successfully retrieved.',
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
                description: 'Product ID',
              },
              title: {
                type: 'string',
                description: 'Product title',
              },
            },
            required: ['id', 'title'],
          },
        },
        total: {
          type: 'number',
          description: 'Total number of products',
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
  @ApiResponse({
    status: 200,
    description: 'The products have been successfully retrieved.',
  })
  async getProductsFromElasticsearch(
    @Query(new ZodValidationPipe(GetProductsQuerySchema))
    queryDto: GetProductsQuery,
  ): Promise<PaginatedResponse<ElasticProduct>> {
    return this.productSearchService.getProducts(queryDto);
  }

  @ApiOperation({ summary: 'Get products from the main database' })
  @ApiQuery({
    name: 'select',
    required: false,
    description:
      'Array of field names to select. Available fields: id, title, description, category, tags, price, discountPercentage, rating, stock, availabilityStatus, brand, sku, weight, warrantyInformation, shippingInformation, returnPolicy, minimumOrderQuantity, thumbnail',
    type: [String],
    example: [
      'id',
      'title',
      'description',
      'category',
      'tags',
      'price',
      'discountPercentage',
      'rating',
      'stock',
      'availabilityStatus',
      'brand',
      'sku',
      'weight',
      'warrantyInformation',
      'shippingInformation',
      'returnPolicy',
      'minimumOrderQuantity',
      'thumbnail',
    ],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description:
      'JSON array of search filters. Each filter can be: { "column": "brand", "operation": "like", "value": "Apple" } or { "column": "price", "operation": ">", "value": 50 } or ',
    type: String,
    example: '[{"column":"brand","operation":"like","value":"Apple"}]',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    description:
      'JSON array of sort orders. Format: [{"column": "id", "direction": "asc"}] or [{"column": "brand", "direction": "desc"}]',
    type: String,
    example: '[{"column":"brand","direction":"desc"}]',
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
    description: 'The products have been successfully retrieved.',
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
                description: 'Product ID',
              },
              title: {
                type: 'string',
                description: 'Product title',
              },
            },
            required: ['id', 'title'],
          },
        },
        total: {
          type: 'number',
          description: 'Total number of products',
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
  @Get('from-main-database')
  async getProductsFromMainDatabase(
    @Query(new ZodValidationPipe(GetProductsQuerySchema))
    queryDto: GetProductsQuery,
  ): Promise<PaginatedResponse<Selectable<DB['product']>>> {
    return this.mainDatabaseService.getProducts(queryDto);
  }

  @Get('aggs')
  @ApiOperation({ summary: 'Get product aggregations from the main database' })
  @ApiResponse({
    status: 200,
    description: 'The product aggregations have been successfully retrieved.',
    schema: {
      type: 'object',
      properties: {
        total: {
          type: 'number',
          description: 'Total number of products',
        },
        tag: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Tag name',
            },
            productCount: {
              type: 'number',
              description: 'Total number of products with this tag',
            },
          },
          required: ['name', 'productCount'],
        },
        category: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Category name',
            },
            productCount: {
              type: 'number',
              description: 'Total number of products with this category',
            },
          },
          required: ['name', 'productCount'],
        },
        brand: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Brand name',
            },
            productCount: {
              type: 'number',
              description: 'Total number of products with this brand',
            },
          },
          required: ['name', 'productCount'],
        },
        availabilityStatus: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Availability status name',
            },
            productCount: {
              type: 'number',
              description:
                'Total number of products with this availability status',
            },
          },
          required: ['name', 'productCount'],
        },
        price: {
          type: 'object',
          properties: {
            min: {
              type: 'number',
              description: 'Minimum price',
            },
            max: {
              type: 'number',
              description: 'Maximum price',
            },
            average: {
              type: 'number',
              description: 'Average price',
            },
          },
          required: ['min', 'max', 'average'],
        },
      },
      required: [
        'total',
        'tag',
        'category',
        'brand',
        'availabilityStatus',
        'price',
      ],
    },
  })
  async getProductAggregations(): Promise<ProductAggregation> {
    return this.mainDatabaseService.getProductAggregations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID from the main database' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'Product ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'select',
    required: false,
    description:
      'Array of field names to select. Available fields: id, title, description, category, tags, price, discountPercentage, rating, stock, availabilityStatus, brand, sku, weight, warrantyInformation, shippingInformation, returnPolicy, minimumOrderQuantity, thumbnail',
    type: [String],
    example: [
      'id',
      'title',
      'description',
      'category',
      'tags',
      'price',
      'discountPercentage',
      'rating',
      'stock',
      'availabilityStatus',
      'brand',
      'sku',
      'weight',
      'warrantyInformation',
      'shippingInformation',
      'returnPolicy',
      'minimumOrderQuantity',
      'thumbnail',
    ],
  })
  @ApiResponse({
    status: 200,
    description: 'The product has been successfully retrieved.',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Product ID',
        },
        title: {
          type: 'string',
          description: 'Product title',
        },
      },
      required: ['id', 'title'],
    },
  })
  async getProductById(
    @Param('id', new ParsePositiveIntPipe()) id: number,
    @Query('select', defaultSelectPipe)
    select: readonly (keyof DB['product'])[],
  ): Promise<Selectable<DB['product']>> {
    return this.mainDatabaseService.getProductById(id, select);
  }
}
