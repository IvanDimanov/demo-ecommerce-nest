import { z } from 'zod';

import { AVAILABLE_PRODUCT_SEARCH } from '../constants';

const numberSearchColumns = ['id', 'price', 'rating', 'weight', 'stock'];
const textSearchColumns = AVAILABLE_PRODUCT_SEARCH.filter(
  (column) => !numberSearchColumns.includes(column),
);

export const textSearchOperations = ['like', 'not like'] as const;
const numberSearchOperations = ['=', '!=', '>', '>=', '<', '<='] as const;

const textSearchObject = z.object({
  column: z.enum(textSearchColumns),
  operation: z.enum(textSearchOperations).default('like'),
  value: z.string(),
});

const numberSearchObject = z.object({
  column: z.enum(numberSearchColumns),
  operation: z.enum(numberSearchOperations).default('='),
  value: z.number(),
});

const searchObject = z.union([textSearchObject, numberSearchObject]);

export const parseProductSearch = () =>
  z.preprocess((value: unknown): unknown => {
    if (typeof value === 'string') {
      return JSON.parse(value) as unknown;
    }
    return value;
  }, z.array(searchObject).optional().default([]));
