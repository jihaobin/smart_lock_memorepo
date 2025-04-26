import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { ZodObject, ZodRawShape } from 'zod';

export function ZodSchemaToSwagger<T extends ZodObject<ZodRawShape>>(
  schema: T,
) {
  const dtoClass = createZodDto(schema);
  const shape = schema.shape;

  for (const key in shape) {
    const property = shape[key];
    ApiProperty({
      type: property._def.typeName,
      description: property.description || `Field ${key}`,
      required: !property.isOptional(),
      example: property._def.defaultValue,
      ...(property._def.checks?.length
        ? {
            enum: property._def.checks.find((c) => c.kind === 'enum')?.values,
          }
        : {}),
    })(dtoClass.prototype, key);
  }

  return dtoClass;
}
