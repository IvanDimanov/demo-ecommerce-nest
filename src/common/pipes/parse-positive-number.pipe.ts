import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsePositiveNumberPipe implements PipeTransform<string, number> {
  constructor(private readonly maxValue?: number) {}

  private static validateMaxValue(value: number) {
    if (Number.isNaN(value)) {
      throw new BadRequestException(
        `Max value is not a valid number: "${value}"`,
      );
    }

    if (value <= 0) {
      throw new BadRequestException(
        `Max value is not a positive number: "${value}"`,
      );
    }
  }

  static maxValue(maxValue: number) {
    ParsePositiveNumberPipe.validateMaxValue(maxValue);
    return new ParsePositiveNumberPipe(maxValue);
  }

  transform(value: string): number {
    const val = Number.parseFloat(value);

    if (Number.isNaN(val)) {
      throw new BadRequestException(`"${value}" is not a valid number`);
    }

    if (val <= 0) {
      throw new BadRequestException(`${value} is not a positive number`);
    }

    if (this.maxValue !== undefined && val > this.maxValue) {
      throw new BadRequestException(
        `"${value}" is greater than the allowed maximum (${this.maxValue})`,
      );
    }

    return val;
  }
}
