import { z } from 'zod';

/**
 * 路由项接口定义
 */
export interface RouteItem {
  id: string;
  path: string;
  name: string;
  component: string;
  icon?: string | null;
  parentId?: string | null;
  order?: number | null;
  meta?: {
    title?: string;
    description?: string;
    hidden?: boolean;
  } | null;
  children?: RouteItem[];
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
  component: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isMenu?: boolean;
  meta?: {
    title?: string;
    description?: string;
    hidden?: boolean;
  };
}

/**
 * 更新路由请求数据接口
 */
export interface UpdateRouteDto {
  path?: string;
  name?: string;
  component?: string;
  icon?: string;
  parentId?: string;
  order?: number;
  isMenu?: boolean;
  meta?: {
    title?: string;
    description?: string;
    hidden?: boolean;
  };
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
  component: z.string().min(1, '组件不能为空'),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().optional(),
  isMenu: z.boolean().optional(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      hidden: z.boolean().optional(),
    })
    .optional(),
});

export const UpdateRouteSchema = z.object({
  path: z.string().min(1, '路径不能为空').optional(),
  name: z.string().min(1, '名称不能为空').optional(),
  component: z.string().min(1, '组件不能为空').optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().optional(),
  isMenu: z.boolean().optional(),
  meta: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      hidden: z.boolean().optional(),
    })
    .optional(),
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
