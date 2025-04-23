import { z } from 'zod';

import { RoleItem, RouteItem } from './rbac';

// 定义通用的强密码验证规则
const strongPasswordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
  .regex(/[a-z]/, '密码需要包含至少一个小写字母')
  .regex(/[0-9]/, '密码需要包含至少一个数字');

// 管理员登录参数校验
export const AdminLoginSchema = z.object({
  name: z.string().min(1, '用户名不能为空'),
  password: z.string().min(8, '密码至少8位字符'),
  rememberMe: z.boolean().optional(),
});

// 管理员修改密码参数校验
export const AdminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, '当前密码至少6位字符'),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(8, '确认密码至少需要8个字符'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

// 创建管理员参数校验
export const AdminCreateSchema = z
  .object({
    name: z.string().min(1, '用户名不能为空'),
    password: strongPasswordSchema,
    confirmPassword: z.string(),
    roleIds: z.array(z.string()).optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

// 类型定义
export type AdminLoginSchemaType = z.infer<typeof AdminLoginSchema>;
export type AdminChangePasswordSchemaType = z.infer<typeof AdminChangePasswordSchema>;
export type AdminCreateSchemaType = z.infer<typeof AdminCreateSchema>;

export interface AdminAuthUser {
  id: string;
  name: string;
  roles: RoleItem[];
  accessibleRoutes: RouteItem[];
}

// 管理员认证响应接口
export interface AdminAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  user: AdminAuthUser;
}
