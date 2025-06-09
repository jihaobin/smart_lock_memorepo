import { z } from 'zod/v4';

/**
 * 路由项接口定义
 */
export interface RouteItem {
  id: string;
  path: string;
  name: string;
  icon?: string | null;
  parentId?: string | null;
  order?: number | null;
  isHidden: boolean;
  children?: RouteItem[];
  role: string[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * 角色项接口定义
 */
export interface RoleItem {
  id: string;
  name: string;
  description?: string | null;
  isDefault?: boolean | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

/**
 * 创建路由请求数据接口
 */
export interface CreateRouteDto {
  path: string;
  name: string;
  role: string[];
  icon?: string;
  parentId?: string;
  order?: number;
  isMenu?: boolean;
  isHidden?: boolean;
}

/**
 * 更新路由请求数据接口
 */
export interface UpdateRouteDto {
  role?: string[];
  name?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isHidden?: boolean;
}

/**
 * 创建角色请求数据接口
 */
export interface CreateRoleDto {
  name: string;
  description?: string;
  isDefault?: boolean;
}

/**
 * 更新角色请求数据接口
 */
export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

// Zod 验证模式
export const CreateRouteSchema = z.object({
  path: z.string().min(1, '路径不能为空'),
  name: z.string().min(1, '名称不能为空'),
  role: z.string().array().min(1, '请至少选择一名角色'),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().optional(),
  isHidden: z.boolean().optional(),
});

export const UpdateRouteSchema = z.object({
  path: z.string().min(1, '路径不能为空').optional(),
  name: z.string().min(1, '名称不能为空').optional(),
  role: z.string().array().min(1, '请至少选择一名角色').optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().optional(),
  isHidden: z.boolean().optional(),
});

export const CreateRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const UpdateRoleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').optional(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
});

// 类型定义
export type CreateRouteSchemaType = z.infer<typeof CreateRouteSchema>;
export type UpdateRouteSchemaType = z.infer<typeof UpdateRouteSchema>;
export type CreateRoleSchemaType = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleSchemaType = z.infer<typeof UpdateRoleSchema>;

/**
 * 角色路由分配接口
 */
export interface AssignRoutesToRoleDto {
  routeIds: string[];
}

/**
 * 用户角色分配接口
 */
export interface AssignRolesToUserDto {
  roleIds: string[];
}
