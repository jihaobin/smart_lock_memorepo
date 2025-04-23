import { GetAllDataType, getAllDataSchema } from './common';
import { RoleItem, CreateRoleDto, UpdateRoleDto, CreateRoleSchema, UpdateRoleSchema } from './rbac';

// --------------------------
// Schema
// --------------------------

/**
 * 获取所有角色的查询参数 Schema (复用 common.ts)
 */
export const GetAllRolesSchema = getAllDataSchema;

// 直接导出rbac中的Schema
export { CreateRoleSchema, UpdateRoleSchema };

// --------------------------
// 类型定义
// --------------------------

/**
 * 获取所有角色的查询参数类型
 */
export type GetAllRolesType = GetAllDataType;

/**
 * 创建角色的请求数据类型 (直接使用rbac.ts的定义)
 */
export type CreateRoleType = CreateRoleDto;

/**
 * 更新角色的请求数据类型 (直接使用rbac.ts的定义)
 */
export type UpdateRoleType = UpdateRoleDto;

// --------------------------
// 响应类型
// --------------------------

/**
 * 角色数据接口 (直接使用rbac.ts的RoleItem)
 */
export type RoleItemType = RoleItem;

/**
 * 获取所有角色的响应数据结构
 */
export interface GetAllRolesResponse {
  items: RoleItem[]; // 直接使用RoleItem而非RoleItemType
  total: number;
  page: number;
  pageSize: number;
}
