import { z, type ZodType } from 'zod';
import { DEFAULT_ORDER_BY } from '../constants';

export const parseOrderBy = (
  options: { columnNames: ZodType<string> } = { columnNames: z.string() },
) =>
  z.preprocess(
    (value: unknown): unknown => {
      if (typeof value === 'string') {
        return JSON.parse(value) as unknown;
      }
      return value;
    },
    z
      .array(
        z.object({
          column: options.columnNames,
          direction: z.enum(['asc', 'desc']),
        }),
      )
      .optional()
      .default(DEFAULT_ORDER_BY),
  );
