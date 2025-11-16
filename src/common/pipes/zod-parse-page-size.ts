import { z } from 'zod';
import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from '../constants';

export const parsePageSize = z.preprocess((value: unknown): unknown => {
  if (typeof value === 'string') {
    return Number(value);
  }
  return value;
}, z.number().int().positive().max(MAX_PAGE_SIZE).optional().default(DEFAULT_PAGE_SIZE));
