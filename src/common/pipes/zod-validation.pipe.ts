import { type PipeTransform, BadRequestException } from '@nestjs/common';
import { z, type ZodType } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) {}

  transform(value: unknown) {
    try {
      const parse = this.schema.safeParse(value);
      if (!parse.success) {
        const prettyError = z.prettifyError(parse.error);
        throw new BadRequestException(prettyError);
      }
      return parse.data;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid input',
      );
    }
  }
}
