import { z } from 'zod';
import { TemporaryPasswordInfo } from '@smart-lock/shared';
import { useApi } from '@/contexts/api-context';

/**
 * 获取临时密码列表的查询参数schema
 */
export const GetTemporaryPasswordsSchema = z.object({
  deviceId: z.string().optional(),
  creatorId: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('10'),
  sortBy: z.enum(['createdAt', 'expiresAt', 'remainingUses']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * 获取临时密码列表的响应类型
 */
export interface TemporaryPasswordsResponse {
  items: TemporaryPasswordInfo[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 临时密码服务类，提供与临时密码相关的API请求方法
 */
export const useTemporaryPasswordService = () => {
  const { apiClient } = useApi();

  /**
   * 获取临时密码列表
   * @param params 查询参数
   */
  const getTemporaryPasswords = async (params: z.infer<typeof GetTemporaryPasswordsSchema>) => {
    // 转换参数格式，将字符串转换为数字
    const queryParams = {
      ...params,
      page: parseInt(params.page, 10),
      limit: parseInt(params.limit, 10),
    };

    const response = await apiClient.get<{
      items: TemporaryPasswordInfo[];
      total: number;
      page: number;
      limit: number;
    }>('/temporary-password', {
      params: queryParams,
    });

    // 转换为统一的分页响应格式
    return {
      items: response.items,
      meta: {
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: Math.ceil(response.total / response.limit),
      },
    } as TemporaryPasswordsResponse;
  };

  /**
   * 创建临时密码
   * @param data 创建数据
   */
  const createTemporaryPassword = async (data: {
    name: string;
    deviceId: string;
    password: string;
    expiresAt?: Date;
    remainingUses?: number;
  }) => {
    return apiClient.post<TemporaryPasswordInfo>('/temporary-password', data);
  };

  /**
   * 删除临时密码
   * @param id 密码ID
   */
  const deleteTemporaryPassword = async (id: string) => {
    return apiClient.delete<{ success: boolean }>(`/temporary-password/${id}`);
  };

  /**
   * 批量删除临时密码
   * @param ids 密码ID数组
   */
  const batchDeleteTemporaryPasswords = async (ids: string[]) => {
    return apiClient.delete<{ deletedCount: number }>('/temporary-password', {
      data: { ids },
    });
  };

  return {
    getTemporaryPasswords,
    createTemporaryPassword,
    deleteTemporaryPassword,
    batchDeleteTemporaryPasswords,
  };
};
