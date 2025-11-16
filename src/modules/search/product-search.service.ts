import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import type * as es from '@elastic/elasticsearch';

import type { ElasticProduct } from 'src/common/dto/elasticsearch.dto';
import { type GetProductsQuery } from '../product/dto/get-products-query.dto';
import { PaginatedResponse } from 'src/common/dto/paginated-response.dto';

const analyzableFields = ['category', 'tags', 'availabilityStatus'];

type NumericSqlOperation = '=' | '!=' | '>' | '>=' | '<' | '<=';

const sqlNumericToElasticOperation: Record<
  NumericSqlOperation,
  'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte'
> = {
  '=': 'eq',
  '!=': 'ne',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
};

type ProductSearch = GetProductsQuery['search'][number];

@Injectable()
export class ProductSearchService {
  private readonly indexName = 'products';
  private readonly logger = new Logger('ProductSearchService');

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async onModuleDestroy() {
    this.logger.log('Closing Elasticsearch client');
    await this.elasticsearchService.close();
    this.logger.log('Elasticsearch client closed');
  }

  async getProducts(
    queryDto: GetProductsQuery,
  ): Promise<PaginatedResponse<ElasticProduct>> {
    const analyzableMatch = (queryDto.search ?? [])
      .filter((search: ProductSearch) =>
        analyzableFields.includes(search.column),
      )
      .reduce(
        (analyzableMap, searchItem) => {
          analyzableMap[searchItem.column] = {
            query: String(searchItem.value),
            operator: 'and',
          };
          return analyzableMap;
        },
        {} as Record<string, { query: string; operator: 'and' }>,
      );

    const wildcard = (queryDto.search ?? [])
      .filter(
        (search: ProductSearch) => !analyzableFields.includes(search.column),
      )
      .filter((search: ProductSearch) => search.operation === 'like')
      .reduce(
        (wildcardMap, searchItem) => {
          wildcardMap[searchItem.column] = {
            value: `*${searchItem.value}*`,
            case_insensitive: true,
          };
          return wildcardMap;
        },
        {} as Record<string, { value: string; case_insensitive: boolean }>,
      );

    const range = (queryDto.search ?? [])
      .filter(
        (search: ProductSearch) =>
          sqlNumericToElasticOperation[search.operation as NumericSqlOperation],
      )
      .reduce(
        (rangeMap, searchItem) => {
          if (!rangeMap[searchItem.column]) {
            rangeMap[searchItem.column] = {} as Record<
              NumericSqlOperation,
              number
            >;
          }
          const operation =
            sqlNumericToElasticOperation[
              searchItem.operation as NumericSqlOperation
            ];
          rangeMap[searchItem.column][operation] = Number.parseFloat(
            String(searchItem.value),
          );
          return rangeMap;
        },
        {} as Record<string, { [key in NumericSqlOperation]: number }>,
      );

    const mustNotWildcard = (queryDto.search ?? [])
      .filter((search: ProductSearch) => search.operation === 'not like')
      .reduce(
        (wildcardMap, searchItem) => {
          wildcardMap[searchItem.column] = {
            value: `*${searchItem.value}*`,
            case_insensitive: true,
          };
          return wildcardMap;
        },
        {} as Record<string, { value: string; case_insensitive: boolean }>,
      );

    const must: es.estypes.QueryDslQueryContainer[] = [];
    if (Object.keys(analyzableMatch).length > 0) {
      must.push({
        match: analyzableMatch,
      } as es.estypes.QueryDslQueryContainer);
    }
    if (Object.keys(wildcard).length > 0) {
      must.push({ wildcard } as es.estypes.QueryDslQueryContainer);
    }
    if (Object.keys(range).length > 0) {
      must.push({ range } as es.estypes.QueryDslQueryContainer);
    }

    const mustNot: es.estypes.QueryDslQueryContainer[] = [];
    if (Object.keys(mustNotWildcard).length > 0) {
      mustNot.push({
        wildcard: mustNotWildcard,
      } as es.estypes.QueryDslQueryContainer);
    }

    const result = await this.elasticsearchService.search<ElasticProduct>({
      index: this.indexName,

      // Profiling
      _source: queryDto.select,

      // Filtration
      query: {
        bool: {
          must,
          must_not: mustNot,
        },
      },

      // Sorting
      sort: queryDto.orderBy.map((orderBy) => ({
        [orderBy.column as keyof ElasticProduct]: orderBy.direction,
      })),

      // Pagination
      from: (queryDto.page - 1) * queryDto.pageSize,
      size: queryDto.pageSize,
    });

    const total = (() => {
      if (typeof result.hits.total === 'number') {
        return result.hits.total;
      }
      if (
        typeof result.hits.total === 'object' &&
        typeof result.hits.total.value === 'number'
      ) {
        return Number(result.hits.total.value);
      }
      return 0;
    })();

    return {
      data: result.hits.hits
        .map((hit) => hit._source)
        .filter((product): product is NonNullable<typeof product> =>
          Boolean(product),
        ),
      total,
      page: queryDto.page,
      pageSize: queryDto.pageSize,
      totalPages: Math.ceil(total / queryDto.pageSize),
    };
  }
}
