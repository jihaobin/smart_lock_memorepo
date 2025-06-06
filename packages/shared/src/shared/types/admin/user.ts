import { z } from 'zod';

import { AdminCreateSchema } from './auth'; // 复用创建用户的 Schema
import { GetAllDataType, getAllDataSchema } from './common';
import { RoleItem } from './rbac'; // 引入 RoleItem

/**
 * 管理后台可以登录的用户
 */

// --------------------------
// Schema
// --------------------------

/**
 * 获取所有管理员用户的查询参数 Schema
 */
export const GetAllAdminUsersSchema = getAllDataSchema;

/**
 * 创建管理员用户的 Schema (复用 auth.ts 中的定义)
 */
export const CreateAdminUserSchema = AdminCreateSchema;

/**
 * 更新管理员用户的 Schema
 */
export const UpdateAdminUserSchema = z.object({
  name: z.string().min(1, '用户名不能为空').optional(),
  password: z.string().min(6, '密码至少6位字符').optional(),
  // 密码更新通常在单独的接口处理，这里不包含密码字段
  roleIds: z.array(z.string()).optional(), // 允许更新用户角色
});

// --------------------------
// 类型定义
// --------------------------

/**
 * 获取所有管理员用户的查询参数类型
 */
export type GetAllAdminUsersType = GetAllDataType;

/**
 * 创建管理员用户的类型 (复用 auth.ts 中的定义)
 */
export type CreateAdminUserType = Required<z.infer<typeof CreateAdminUserSchema>>;

/**
 * 更新管理员用户的类型
 */
export type UpdateAdminUserType = z.infer<typeof UpdateAdminUserSchema>;

// --------------------------
// 响应类型
// --------------------------

/**
 * 管理员用户数据接口 (用于列表和详情)
 */
export interface AdminUserItem {
  id: string;
  name: string;
  createdAt: Date | string | null; // 保持与 schema 一致，允许 string
  updatedAt: Date | string | null;
  roles: RoleItem[]; // 关联的角色信息
}
