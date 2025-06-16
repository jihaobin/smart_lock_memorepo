import { z } from 'zod/v4';
import { getAllDataSchema, GetAllDataType } from '../admin/common';

export interface IUser {
  id: string;
  phone: string;
  nikeName: string;
}

/**
 * 普通用户相关的类型定义
 */

// --------------------------
// Schema
// --------------------------

/**
 * 获取所有用户的查询参数 Schema
 */
export const GetAllUsersSchema = getAllDataSchema;

/**
 * 根据手机号查询用户的 Schema
 */
export const GetUserByPhoneSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号'),
});

// --------------------------
// 类型定义
// --------------------------

/**
 * 获取所有用户的查询参数类型
 */
export type GetAllUsersType = GetAllDataType;

/**
 * 根据手机号查询用户的类型
 */
export type GetUserByPhoneType = Required<z.infer<typeof GetUserByPhoneSchema>>;

// --------------------------
// 响应类型
// --------------------------

/**
 * 用户数据接口 (用于列表和详情，排除敏感信息)
 */
export interface UserItem {
  id: string;
  phone: string;
  nikeName: string;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

/**
 * 用户列表响应接口
 */
export interface GetAllUsersResponse {
  items: UserItem[];
  total: number;
  page: number;
  pageSize: number;
}
