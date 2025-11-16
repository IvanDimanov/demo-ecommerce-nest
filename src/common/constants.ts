export const DEFAULT_SELECT = ['id'] as const;
export const DEFAULT_ORDER_BY = [
  {
    column: 'id' as const,
    direction: 'asc' as const,
  },
];
export const DEFAULT_PAGE = 1 as const;
export const DEFAULT_PAGE_SIZE = 10 as const;
export const MAX_PAGE_SIZE = 100 as const;
