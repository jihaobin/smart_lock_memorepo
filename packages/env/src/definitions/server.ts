import { randomBytes } from 'node:crypto';

import { z } from 'zod';

import { defineEnv } from './metadata';

const nonEmpty = (name: string) => z.string().min(1, `${name} 不能为空`);
const secret = () => randomBytes(32).toString('hex');

export const serverDefinitions = {
  NODE_ENV: defineEnv({
    description: '运行环境',
    group: 'server',
    schema: z.enum(['development', 'test', 'production']).default('development'),
    required: true,
    secret: false,
    defaultValue: 'development',
  }),
  PORT: defineEnv({
    description: 'API 端口',
    group: 'server',
    schema: z.coerce.number().int().min(1).max(65535).default(3000),
    required: true,
    secret: false,
    defaultValue: 3000,
    deprecatedAliases: ['API_PORT'],
  }),
  NEXT_PUBLIC_APP_URL: defineEnv({
    description: '允许跨域访问的客户端 URL',
    group: 'server',
    schema: z.string().url().optional(),
    required: false,
    secret: false,
  }),
  DEBUG_KEY: defineEnv({
    description: '调试接口密钥',
    group: 'server',
    schema: z.string().min(16),
    required: true,
    secret: true,
    generateLocalValue: secret,
  }),
  DATABASE_USER: defineEnv({
    description: '数据库用户名',
    group: 'database',
    schema: nonEmpty('DATABASE_USER').default('postgres'),
    required: true,
    secret: false,
    defaultValue: 'postgres',
  }),
  DATABASE_PASSWORD: defineEnv({
    description: '数据库密码',
    group: 'database',
    schema: nonEmpty('DATABASE_PASSWORD'),
    required: true,
    secret: true,
    generateLocalValue: secret,
  }),
  DATABASE_NAME: defineEnv({
    description: '数据库名称',
    group: 'database',
    schema: nonEmpty('DATABASE_NAME').default('smart_lock'),
    required: true,
    secret: false,
    defaultValue: 'smart_lock',
  }),
  DATABASE_URL: defineEnv({
    description: 'PostgreSQL 连接 URL',
    group: 'database',
    schema: z.string().url().startsWith('postgresql://'),
    required: true,
    secret: true,
    generateLocalValue: values =>
      `postgresql://${encodeURIComponent(values.DATABASE_USER)}:${encodeURIComponent(values.DATABASE_PASSWORD)}@localhost:5432/${encodeURIComponent(values.DATABASE_NAME)}`,
  }),
  JWT_SECRET: defineEnv({
    description: 'JWT 签名密钥',
    group: 'server',
    schema: z.string().min(32),
    required: true,
    secret: true,
    generateLocalValue: secret,
  }),
  JWT_EXPIRES_IN: defineEnv({
    description: 'JWT 有效期',
    group: 'server',
    schema: nonEmpty('JWT_EXPIRES_IN').default('1d'),
    required: true,
    secret: false,
    defaultValue: '1d',
  }),
  MAIL_HOST: defineEnv({
    description: '邮件服务器主机',
    group: 'third-party',
    schema: nonEmpty('MAIL_HOST'),
    required: true,
    secret: false,
  }),
  MAIL_PORT: defineEnv({
    description: '邮件服务器端口',
    group: 'third-party',
    schema: z.coerce.number().int().min(1).max(65535),
    required: true,
    secret: false,
  }),
  MAIL_USER: defineEnv({
    description: '邮件服务用户名',
    group: 'third-party',
    schema: nonEmpty('MAIL_USER'),
    required: true,
    secret: false,
  }),
  MAIL_PASS: defineEnv({
    description: '邮件服务密码',
    group: 'third-party',
    schema: nonEmpty('MAIL_PASS'),
    required: true,
    secret: true,
  }),
  MAIL_FROM_NAME: defineEnv({
    description: '邮件发件人名称',
    group: 'third-party',
    schema: nonEmpty('MAIL_FROM_NAME'),
    required: true,
    secret: false,
  }),
  ALIYUN_ACCESS_KEY_ID: defineEnv({
    description: '阿里云 AccessKey ID',
    group: 'third-party',
    schema: nonEmpty('ALIYUN_ACCESS_KEY_ID'),
    required: true,
    secret: true,
  }),
  ALIYUN_ACCESS_KEY_SECRET: defineEnv({
    description: '阿里云 AccessKey Secret',
    group: 'third-party',
    schema: nonEmpty('ALIYUN_ACCESS_KEY_SECRET'),
    required: true,
    secret: true,
  }),
  ALIYUN_SMS_SIGN_NAME: defineEnv({
    description: '阿里云短信签名',
    group: 'third-party',
    schema: nonEmpty('ALIYUN_SMS_SIGN_NAME'),
    required: true,
    secret: false,
  }),
  ALIYUN_SMS_TEMPLATE_CODE: defineEnv({
    description: '阿里云短信模板代码',
    group: 'third-party',
    schema: nonEmpty('ALIYUN_SMS_TEMPLATE_CODE'),
    required: true,
    secret: false,
  }),
  ALIYUN_STS_ROLE_ARN: defineEnv({
    description: '阿里云 STS 角色 ARN',
    group: 'third-party',
    schema: nonEmpty('ALIYUN_STS_ROLE_ARN'),
    required: true,
    secret: false,
  }),
  ALIYUN_STS_ROLE_SESSION_NAME: defineEnv({
    description: '阿里云 STS 会话名称',
    group: 'third-party',
    schema: nonEmpty('ALIYUN_STS_ROLE_SESSION_NAME').default('SmartLockApp'),
    required: true,
    secret: false,
    defaultValue: 'SmartLockApp',
  }),
  ALIYUN_STS_POLICY: defineEnv({
    description: '阿里云 STS 策略',
    group: 'third-party',
    schema: z.string().default(''),
    required: false,
    secret: false,
    defaultValue: '',
  }),
  ALIYUN_STS_DURATION_SECONDS: defineEnv({
    description: '阿里云 STS 有效秒数',
    group: 'third-party',
    schema: z.coerce.number().int().positive().default(3600),
    required: true,
    secret: false,
    defaultValue: 3600,
  }),
  SUPER_ADMIN_USERNAME: defineEnv({
    description: '超级管理员用户名',
    group: 'server',
    schema: nonEmpty('SUPER_ADMIN_USERNAME'),
    required: true,
    secret: false,
  }),
  SUPER_ADMIN_PASSWORD: defineEnv({
    description: '超级管理员密码',
    group: 'server',
    schema: nonEmpty('SUPER_ADMIN_PASSWORD'),
    required: true,
    secret: true,
  }),
} as const;

type ServerShape = {
  [K in keyof typeof serverDefinitions]: (typeof serverDefinitions)[K]['schema'];
};
const serverShape = Object.fromEntries(
  Object.entries(serverDefinitions).map(([key, definition]) => [key, definition.schema])
) as ServerShape;
export const serverEnvSchema = z.object(serverShape);
export type ServerEnv = z.infer<typeof serverEnvSchema>;
