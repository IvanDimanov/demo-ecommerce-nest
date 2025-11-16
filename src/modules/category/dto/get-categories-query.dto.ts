import { z } from 'zod';
import { parseSelect } from 'src/common/pipes/zod-parse-select';
import { parseOrderBy } from 'src/common/pipes/zod-parse-order-by';
import { parsePage } from 'src/common/pipes/zod-parse-page';
import { parsePageSize } from 'src/common/pipes/zod-parse-page-size';
import { parseCategorySearch } from '../pipes/zod-parse-category-search';

export const GetCategoriesQuerySchema = z.object({
  select: parseSelect({ selectNames: z.enum(['id', 'name']) }),
  search: parseCategorySearch(),
  orderBy: parseOrderBy({ columnNames: z.enum(['id', 'name']) }),
  page: parsePage,
  pageSize: parsePageSize,
});

export type GetCategoriesQuery = z.infer<typeof GetCategoriesQuerySchema>;
