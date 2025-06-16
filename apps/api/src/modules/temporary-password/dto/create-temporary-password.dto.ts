import { z } from 'zod/v4';

// 创建临时密码的验证schema
export const CreateTemporaryPasswordSchema = z.object({
  name: z.string(),
  deviceId: z.string(),
  password: z.string().length(6, '密码必须为6位字符'),
  expiresAt: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  remainingUses: z
    .number()
    .int()
    .positive('剩余使用次数必须为正整数')
    .optional(),
});

// 创建DTO类
export type CreateTemporaryPasswordDto = z.infer<
  typeof CreateTemporaryPasswordSchema
>;
