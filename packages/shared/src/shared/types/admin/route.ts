import { GetAllDataType, getAllDataSchema } from './common';
import {
  RouteItem,
  CreateRouteDto,
  UpdateRouteDto,
  CreateRouteSchema,
  UpdateRouteSchema,
} from './rbac';

// --------------------------
// Schema
// --------------------------

/**
 * 获取所有路由的查询参数 Schema (复用 common.ts)
 */
export const GetAllRoutesSchema = getAllDataSchema;

// 直接导出rbac中的Schema
export { CreateRouteSchema, UpdateRouteSchema };

// --------------------------
// 类型定义
// --------------------------

/**
 * 获取所有路由的查询参数类型
 */
export type GetAllRoutesType = GetAllDataType;

/**
 * 创建路由的请求数据类型 (直接使用rbac.ts的定义)
 */
export type CreateRouteType = CreateRouteDto;

/**
 * 更新路由的请求数据类型 (直接使用rbac.ts的定义)
 */
export type UpdateRouteType = UpdateRouteDto;

// --------------------------
// 响应类型
// --------------------------

/**
 * 路由数据接口 (直接使用rbac.ts的RouteItem)
 */
export type RouteItemType = RouteItem;

/**
 * 获取所有路由的响应数据结构
 */
export interface GetAllRoutesResponse {
  items: RouteItem[]; // 直接使用RouteItem而非RouteItemType
  total: number;
  page: number;
  pageSize: number;
}
