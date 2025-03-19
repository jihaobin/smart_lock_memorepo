import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

export const envSchema = z.object({
  JWT_SECRET: z
    .string()
    .min(1, 'JWT_SECRET 不能为空')
    .nonempty('JWT_SECRET 不能为空'),
  JWT_EXPIRES_IN: z
    .string()
    .min(1, 'JWT_EXPIRES_IN 不能为空')
    .nonempty('JWT_EXPIRES_IN 不能为空'),
  MAIL_HOST: z
    .string()
    .min(1, 'MAIL_HOST 不能为空')
    .nonempty('MAIL_HOST 不能为空'),
  MAIL_PORT: z
    .string()
    .min(1, 'MAIL_PORT 不能为空')
    .nonempty('MAIL_PORT 不能为空'),
  MAIL_USER: z
    .string()
    .min(1, 'MAIL_USER 不能为空')
    .nonempty('MAIL_USER 不能为空'),
  MAIL_PASS: z
    .string()
    .min(1, 'MAIL_PASS 不能为空')
    .nonempty('MAIL_PASS 不能为空'),
  MAIL_FROM_NAME: z
    .string()
    .min(1, 'MAIL_FROM_NAME 不能为空')
    .nonempty('MAIL_FROM_NAME 不能为空'),
});

export type AppConfig = z.infer<typeof envSchema>;
