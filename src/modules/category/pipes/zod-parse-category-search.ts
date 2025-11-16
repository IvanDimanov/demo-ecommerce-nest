import { z } from 'zod';

const numberSearchColumns = ['id'];
const textSearchColumns = ['name'];

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

export const parseCategorySearch = () =>
  z.preprocess((value: unknown): unknown => {
    if (typeof value === 'string') {
      return JSON.parse(value) as unknown;
    }
    return value;
  }, z.array(searchObject).optional().default([]));
