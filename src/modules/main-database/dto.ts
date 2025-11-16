export type GetAllItemsArgs = {
  select?: string[];
  search?: { column: string; operation: string; value: string | number }[];
  orderBy?: { column: string; direction: 'asc' | 'desc' }[];
  page?: number;
  pageSize?: number;
};

export type AvailabilityStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type ProductAggregation = {
  total: number;
  category: { name: string; productCount: number }[];
  tag: { name: string; productCount: number }[];
  brand: { name: string; productCount: number }[];
  availabilityStatus: { name: AvailabilityStatus; productCount: number }[];
  price: { min: number; max: number; average: number };
};
