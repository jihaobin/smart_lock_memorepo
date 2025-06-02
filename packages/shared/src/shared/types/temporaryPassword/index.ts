import { z } from 'zod';

export interface TemporaryPasswordInfo {
  id: string;
  password: string;
  deviceId: string;
  creatorId: string;
  expiresAt?: Date;
  remainingUses?: number;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export const temporaryPasswordInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  password: z.string(),
  deviceId: z.string(),
  creatorId: z.string(),
  expiresAt: z.date(),
  remainingUses: z.number(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// 创建临时密码的验证schema
export const CreateTemporaryPasswordSchema = z.object({
  name: z.string(),
  deviceId: z.string().length(5, '设备ID必须为5位字符'),
  password: z.string().min(4, '密码至少4位').max(50, '密码最多50位'),
  expiresAt: z.date().optional(),
  remainingUses: z.number().int().positive('剩余使用次数必须为正整数').optional(),
});

// 导出类型
export type CreateTemporaryPasswordType = z.infer<typeof CreateTemporaryPasswordSchema>;

// 查询临时密码的验证schema
export const QueryTemporaryPasswordSchema = z.object({
  deviceId: z.string().length(5, '设备ID必须为5位字符').optional(),
  creatorId: z.string().length(5, '创建者ID必须为5位字符').optional(),
  includeExpired: z.boolean().default(false),
  page: z.number().int().positive('页码必须为正整数').default(1),
  limit: z.number().int().positive('每页数量必须为正整数').max(100, '每页最多100条').default(10),
  sortBy: z.enum(['createdAt', 'expiresAt', 'remainingUses']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 批量删除schema
export const BatchDeleteTemporaryPasswordSchema = z.object({
  ids: z.array(z.string().length(5, '密码ID必须为5位字符')).min(1, '至少选择一个密码'),
});

// 验证密码schema
export const ValidateTemporaryPasswordSchema = z.object({
  deviceId: z.string().length(5, '设备ID必须为5位字符'),
  password: z.string().min(4, '密码至少4位').max(50, '密码最多50位'),
});

// 导出类型
export type QueryTemporaryPasswordType = z.infer<typeof QueryTemporaryPasswordSchema>;
export type BatchDeleteTemporaryPasswordType = z.infer<typeof BatchDeleteTemporaryPasswordSchema>;
export type ValidateTemporaryPasswordType = z.infer<typeof ValidateTemporaryPasswordSchema>;
