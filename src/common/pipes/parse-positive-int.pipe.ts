import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  constructor(private readonly maxValue?: number) {}

  private static validateMaxValue(value: number) {
    if (Number.isNaN(value)) {
      throw new BadRequestException(
        `Max value is not a valid number: "${value}"`,
      );
    }

    if (value <= 0) {
      throw new BadRequestException(
        `Max value is not a positive integer: "${value}"`,
      );
    }
  }

  static maxValue(maxValue: number) {
    ParsePositiveIntPipe.validateMaxValue(maxValue);
    return new ParsePositiveIntPipe(maxValue);
  }

  transform(value: string, metadata: ArgumentMetadata): number {
    const val = Number(value);

    if (Number.isNaN(val)) {
      throw new BadRequestException(
        `${metadata.data} parameter is not a valid number: "${value}"`,
      );
    }

    if (!Number.isInteger(val)) {
      throw new BadRequestException(
        `${metadata.data} parameter is not an integer: "${value}"`,
      );
    }

    if (val <= 0) {
      throw new BadRequestException(
        `${metadata.data} parameter is not a positive integer: "${value}"`,
      );
    }

    if (this.maxValue !== undefined && val > this.maxValue) {
      throw new BadRequestException(
        `${metadata.data} parameter value "${value}" is greater than the allowed maximum (${this.maxValue})`,
      );
    }

    return val;
  }
}
