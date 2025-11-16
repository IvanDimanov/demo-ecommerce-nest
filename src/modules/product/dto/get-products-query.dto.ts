import { z } from 'zod';
import { parseSelect } from 'src/common/pipes/zod-parse-select';
import { parseOrderBy } from 'src/common/pipes/zod-parse-order-by';
import { parsePage } from 'src/common/pipes/zod-parse-page';
import { parsePageSize } from 'src/common/pipes/zod-parse-page-size';
import { parseProductSearch } from '../pipes/zod-parse-product-search';
import {
  DEFAULT_PRODUCT_SELECT,
  AVAILABLE_PRODUCT_SELECT,
  AVAILABLE_PRODUCT_ORDER_BY,
} from '../constants';

export const GetProductsQuerySchema = z.object({
  select: parseSelect({
    selectNames: z.enum(AVAILABLE_PRODUCT_SELECT),
    defaultSelect: DEFAULT_PRODUCT_SELECT as unknown as string[],
  }),
  search: parseProductSearch(),
  orderBy: parseOrderBy({
    columnNames: z.enum(AVAILABLE_PRODUCT_ORDER_BY),
  }),
  page: parsePage,
  pageSize: parsePageSize,
});

export type GetProductsQuery = z.infer<typeof GetProductsQuerySchema>;
