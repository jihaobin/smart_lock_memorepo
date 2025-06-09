import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 查询临时密码的验证schema
export const QueryTemporaryPasswordSchema = z.object({
  deviceId: z.string().optional(),
  creatorId: z.string().optional(),
  page: z.number().int().positive('页码必须为正整数').default(1),
  limit: z
    .number()
    .int()
    .positive('每页数量必须为正整数')
    .max(100, '每页最多100条')
    .default(10),
  sortBy: z
    .enum(['createdAt', 'expiresAt', 'remainingUses'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 分页查询DTO类
export class QueryTemporaryPasswordDto extends createZodDto(
  QueryTemporaryPasswordSchema,
) {}

// 批量删除schema
export const BatchDeleteTemporaryPasswordSchema = z.object({
  ids: z
    .array(z.string().length(5, '密码ID必须为5位字符'))
    .min(1, '至少选择一个密码'),
});

// 批量删除DTO类
export class BatchDeleteTemporaryPasswordDto extends createZodDto(
  BatchDeleteTemporaryPasswordSchema,
) {}

// 验证密码schema
export const ValidateTemporaryPasswordSchema = z.object({
  deviceId: z.string().length(5, '设备ID必须为5位字符'),
  password: z.string().length(6, '密码必须为6位字符'),
});

// 验证密码DTO类
export class ValidateTemporaryPasswordDto extends createZodDto(
  ValidateTemporaryPasswordSchema,
) {}

// 导出类型
export type QueryTemporaryPasswordType = z.infer<
  typeof QueryTemporaryPasswordSchema
>;
export type BatchDeleteTemporaryPasswordType = z.infer<
  typeof BatchDeleteTemporaryPasswordSchema
>;
export type ValidateTemporaryPasswordType = z.infer<
  typeof ValidateTemporaryPasswordSchema
>;
