import { z } from 'zod';
import { DEFAULT_PAGE } from '../constants';

export const parsePage = z.preprocess((value: unknown): unknown => {
  if (typeof value === 'string') {
    return Number(value);
  }
  return value;
}, z.number().int().positive().optional().default(DEFAULT_PAGE));
