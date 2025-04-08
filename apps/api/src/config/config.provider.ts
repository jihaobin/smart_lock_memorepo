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
  // 阿里云短信服务配置
  ALIYUN_ACCESS_KEY_ID: z
    .string()
    .min(1, 'ALIYUN_ACCESS_KEY_ID 不能为空')
    .nonempty('ALIYUN_ACCESS_KEY_ID 不能为空'),
  ALIYUN_ACCESS_KEY_SECRET: z
    .string()
    .min(1, 'ALIYUN_ACCESS_KEY_SECRET 不能为空')
    .nonempty('ALIYUN_ACCESS_KEY_SECRET 不能为空'),
  ALIYUN_SMS_SIGN_NAME: z
    .string()
    .min(1, 'ALIYUN_SMS_SIGN_NAME 不能为空')
    .nonempty('ALIYUN_SMS_SIGN_NAME 不能为空'),
  ALIYUN_SMS_TEMPLATE_CODE: z
    .string()
    .min(1, 'ALIYUN_SMS_TEMPLATE_CODE 不能为空')
    .nonempty('ALIYUN_SMS_TEMPLATE_CODE 不能为空'),
  // 阿里云STS服务配置
  ALIYUN_STS_ROLE_ARN: z
    .string()
    .min(1, 'ALIYUN_STS_ROLE_ARN 不能为空')
    .nonempty('ALIYUN_STS_ROLE_ARN 不能为空'),
  ALIYUN_STS_ROLE_SESSION_NAME: z
    .string()
    .min(1, 'ALIYUN_STS_ROLE_SESSION_NAME 不能为空')
    .nonempty('ALIYUN_STS_ROLE_SESSION_NAME 不能为空')
    .default('SmartLockApp'),
  ALIYUN_STS_POLICY: z
    .string()
    .optional()
    .default(''),
  ALIYUN_STS_DURATION_SECONDS: z
    .string()
    .min(1, 'ALIYUN_STS_DURATION_SECONDS 不能为空')
    .default('3600'),
});

export type AppConfig = Required<z.infer<typeof envSchema>>;
