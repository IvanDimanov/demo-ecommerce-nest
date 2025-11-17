import { Injectable, Logger } from '@nestjs/common';
import {
  ComparisonOperator,
  Kysely,
  ReferenceExpression,
  SelectExpression,
  Selectable,
  sql,
} from 'kysely';
import { InjectKysely } from 'nestjs-kysely';

import type { DB } from '../../common/dto/main-database.dto';
import {
  DEFAULT_SELECT,
  DEFAULT_ORDER_BY,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
} from '../../common/constants';
import type {
  GetAllItemsArgs,
  ProductAggregation,
  AvailabilityStatus,
} from './dto';
import { PaginatedResponse } from '../../common/dto/paginated-response.dto';
import { textSearchOperations as categoryTextSearchOperations } from '../category/pipes/zod-parse-category-search';
import { textSearchOperations as productTextSearchOperations } from '../product/pipes/zod-parse-product-search';

const injectKysely = InjectKysely as (namespace?: string) => ParameterDecorator;

@Injectable()
export class MainDatabaseService {
  private readonly logger = new Logger('MainDatabaseService');

  constructor(@injectKysely() private readonly db: Kysely<DB>) {}

  async onModuleDestroy() {
    this.logger.log('Closing Kysely client');
    await this.db.destroy();
    this.logger.log('Kysely client closed');
  }

  async getCategories(
    args: GetAllItemsArgs,
  ): Promise<PaginatedResponse<Selectable<DB['category']>>> {
    const {
      select = DEFAULT_SELECT,
      search = [],
      orderBy = DEFAULT_ORDER_BY,
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
    } = args;

    const query = this.db
      .selectFrom('category')

      // Filtration
      .$if(search.length > 0, (qb) => {
        search.forEach(({ column, operation, value }) => {
          qb = qb.where(
            `category.${column}` as ReferenceExpression<DB, 'category'>,
            operation as ComparisonOperator,
            categoryTextSearchOperations.includes(
              operation as (typeof categoryTextSearchOperations)[number],
            )
              ? `%${value}%`
              : value,
          );
        });
        return qb;
      });

    const [data, countAll] = await Promise.all([
      query
        // Profiling
        .select(select as readonly SelectExpression<DB, 'category'>[])

        // Sorting
        .$if(orderBy.length > 0, (qb) => {
          orderBy.forEach(({ column, direction }) => {
            qb = qb.orderBy(column as keyof DB['category'], direction);
          });
          return qb;
        })

        // Pagination
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute(),

      query
        .select(({ fn }) => fn.countAll().as('total'))
        .executeTakeFirstOrThrow(),
    ]);

    return {
      data,
      total: Number(countAll.total),
      page,
      pageSize,
      totalPages: Math.ceil(Number(countAll.total) / pageSize),
    };
  }

  async getProductById(
    id: number,
    select: readonly string[] = DEFAULT_SELECT,
  ): Promise<Selectable<DB['product']>> {
    const productSelect = select
      .filter((column) => column !== 'category' && column !== 'tags')
      .map((column) => `product.${column}`);

    return this.db
      .selectFrom('product')
      .where('product.id', '=', id)

      .$if(
        select.some((column) => column === 'tags'),
        (qb) => {
          return qb
            .leftJoin('productToTag', 'productToTag.productId', 'product.id')
            .leftJoin('tag', 'tag.id', 'productToTag.tagId')
            .select([
              (eb) =>
                eb.fn
                  .coalesce(sql`json_arrayagg(tag.name)`, sql`json_array()`)
                  .as('tags'),
            ])
            .groupBy('product.id');
        },
      )

      .$if(
        select.some((column) => column === 'category'),
        (qb) => {
          return qb
            .leftJoin('category', 'category.id', 'product.categoryId')
            .select([(eb) => eb.ref('category.name').as('category')])
            .groupBy('product.id');
        },
      )

      .select(productSelect as readonly (keyof DB['product'])[])
      .executeTakeFirstOrThrow();
  }

  async getProducts(
    args: GetAllItemsArgs,
  ): Promise<PaginatedResponse<Selectable<DB['product']>>> {
    const {
      select = DEFAULT_SELECT,
      search = [],
      orderBy = DEFAULT_ORDER_BY,
      page = DEFAULT_PAGE,
      pageSize = DEFAULT_PAGE_SIZE,
    } = args;

    const productSelect = select
      .filter((column) => column !== 'category' && column !== 'tags')
      .map((column) => `product.${column}`);

    const query = this.db
      .selectFrom('product')

      // Filtration
      .$if(search.length > 0, (qb) => {
        search.forEach(({ column, operation, value }) => {
          qb = qb.where(
            `product.${column}` as ReferenceExpression<DB, 'product'>,
            operation as ComparisonOperator,
            productTextSearchOperations.includes(
              operation as (typeof productTextSearchOperations)[number],
            )
              ? `%${value}%`
              : value,
          );
        });
        return qb;
      });

    const [data, countAll] = await Promise.all([
      query
        // Profiling
        .$if(
          select.some((column) => column === 'tags'),
          (qb) => {
            return qb
              .leftJoin('productToTag', 'productToTag.productId', 'product.id')
              .leftJoin('tag', 'tag.id', 'productToTag.tagId')
              .select([
                (eb) =>
                  eb.fn
                    .coalesce(sql`json_arrayagg(tag.name)`, sql`json_array()`)
                    .as('tags'),
              ])
              .groupBy('product.id');
          },
        )

        .$if(
          select.some((column) => column === 'category'),
          (qb) => {
            return qb
              .leftJoin('category', 'category.id', 'product.categoryId')
              .select([(eb) => eb.ref('category.name').as('category')])
              .groupBy('product.id');
          },
        )

        .select(productSelect as readonly (keyof DB['product'])[])

        // Sorting
        .$if(orderBy.length > 0, (qb) => {
          orderBy.forEach(({ column, direction }) => {
            qb = qb.orderBy(column as keyof DB['product'], direction);
          });
          return qb;
        })

        // Pagination
        .limit(pageSize)
        .offset((page - 1) * pageSize)
        .execute(),

      query
        .select(({ fn }) => fn.countAll().as('total'))
        .executeTakeFirstOrThrow(),
    ]);

    return {
      data,
      total: Number(countAll.total),
      page,
      pageSize,
      totalPages: Math.ceil(Number(countAll.total) / pageSize),
    };
  }

  private async getTagProductAggregations(): Promise<
    { name: string; productCount: number }[]
  > {
    const rows = await this.db
      .selectFrom('tag')
      .leftJoin('productToTag', 'productToTag.tagId', 'tag.id')
      .select('tag.name')
      .select(({ fn }) => fn.count('productToTag.tagId').as('productCount'))
      .groupBy('tag.id')
      .groupBy('tag.name')
      .execute();

    return rows
      .map((row) => ({
        name: row.name,
        productCount: Number(row.productCount),
      }))
      .sort((a, b) => b.productCount - a.productCount);
  }

  private async getCategoryProductAggregations(): Promise<
    { name: string; productCount: number }[]
  > {
    const rows = await this.db
      .selectFrom('category')
      .leftJoin('product', 'product.categoryId', 'category.id')
      .select('category.name')
      .select(({ fn }) => fn.count('product.id').as('productCount'))
      .groupBy('category.id')
      .groupBy('category.name')
      .execute();

    return rows
      .map((row) => ({
        name: row.name,
        productCount: Number(row.productCount),
      }))
      .sort((a, b) => b.productCount - a.productCount);
  }

  private async getBrandProductAggregations(): Promise<
    { name: string; productCount: number }[]
  > {
    const rows = await this.db
      .selectFrom('product')
      .select('brand')
      .select(({ fn }) => fn.count('product.id').as('productCount'))
      .groupBy('brand')
      .execute();

    return rows
      .map((row) => ({
        name: row.brand,
        productCount: Number(row.productCount),
      }))
      .sort((a, b) => b.productCount - a.productCount);
  }

  private async getAvailabilityStatusAggregations(): Promise<
    { name: AvailabilityStatus; productCount: number }[]
  > {
    const rows = await this.db
      .selectFrom('product')
      .select('availabilityStatus')
      .select(({ fn }) => fn.countAll().as('count'))
      .groupBy('availabilityStatus')
      .execute();

    return rows.map((row) => ({
      name: row.availabilityStatus,
      productCount: Number(row.count),
    }));
  }

  private async getPriceAggregations(): Promise<{
    min: number;
    max: number;
    average: number;
  }> {
    const rows = await this.db
      .selectFrom('product')
      .select(({ fn }) => fn.min('price').as('minPrice'))
      .select(({ fn }) => fn.max('price').as('maxPrice'))
      .select(({ fn }) => fn.avg('price').as('averagePrice'))
      .executeTakeFirstOrThrow();

    return {
      min: Number(rows.minPrice),
      max: Number(rows.maxPrice),
      average: Number(rows.averagePrice),
    };
  }

  async getProductAggregations(): Promise<ProductAggregation> {
    const [
      productAggs,
      tagProductAggs,
      categoryProductAggs,
      brandProductAggs,
      availabilityStatusAggs,
      priceAggs,
    ] = await Promise.all([
      this.db
        .selectFrom('product')
        .select(({ fn }) => fn.countAll().as('total'))
        .executeTakeFirstOrThrow(),

      this.getTagProductAggregations(),
      this.getCategoryProductAggregations(),
      this.getBrandProductAggregations(),
      this.getAvailabilityStatusAggregations(),
      this.getPriceAggregations(),
    ]);

    return {
      total: Number(productAggs.total),
      tag: tagProductAggs,
      category: categoryProductAggs,
      brand: brandProductAggs,
      availabilityStatus: availabilityStatusAggs,
      price: priceAggs,
    };
  }
}
