import { z, type ZodType } from 'zod';
import { DEFAULT_SELECT } from '../constants';

export const parseSelect = (
  options: {
    selectNames?: ZodType<string>;
    defaultSelect?: string[];
  } = {},
) =>
  z.preprocess(
    (value: unknown): unknown => {
      if (typeof value === 'string') {
        return JSON.parse(value) as unknown;
      }
      return value;
    },
    z
      .array(options.selectNames ?? z.string())
      .optional()
      .default(
        options.defaultSelect ?? (DEFAULT_SELECT as unknown as string[]),
      ),
  );
