import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const readableMsg = firstIssue?.message || 'Validation failed';
        throw new BadRequestException({
          message: readableMsg,
          errors: error.flatten().fieldErrors,
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
