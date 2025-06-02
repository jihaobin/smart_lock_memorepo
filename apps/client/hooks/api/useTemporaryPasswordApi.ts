import { useMutation } from '@tanstack/react-query';
import { useApi } from '../../contexts/api-context';
import type { TemporaryPasswordInfo } from '@smart-lock/shared';

/**
 * 临时密码API钩子
 * 提供临时密码模块的所有API操作和查询
 */
export function useTemporaryPasswordApi() {
  const { apiClient, queryHooks } = useApi();
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    temporaryPasswords: ['temporaryPasswords'] as const,
    temporaryPassword: (id: string) => ['temporaryPassword', 'detail', id] as const,
  };

  // 创建临时密码的数据类型（适配前端表单）
  interface CreateTemporaryPasswordRequest {
    name: string;
    deviceId: string;
    password: string;
    expiresAt?: Date;
    remainingUses?: number;
  }

  // 查询临时密码列表的参数类型
  interface QueryTemporaryPasswordParams {
    deviceId?: string;
    creatorId?: string;
    includeExpired?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'expiresAt' | 'remainingUses';
    sortOrder?: 'asc' | 'desc';
  }

  // 分页响应类型
  interface TemporaryPasswordsResponse {
    items: TemporaryPasswordInfo[];
    total: number;
    page: number;
    limit: number;
  }

  // 获取临时密码列表
  const useTemporaryPasswords = (params?: QueryTemporaryPasswordParams) => {
    return useApiQuery<TemporaryPasswordsResponse>(
      [...queryKeys.temporaryPasswords, params],
      '/temporary-password',
      {
        params,
      }
    );
  };

  // 获取单个临时密码详情
  const useTemporaryPassword = (id: string) => {
    return useApiQuery<TemporaryPasswordInfo>(
      queryKeys.temporaryPassword(id),
      `/temporary-password/${id}`
    );
  };

  // 创建临时密码
  const useCreateTemporaryPassword = () => {
    const queryClient = useQueryClient();

    return useApiMutation<TemporaryPasswordInfo, CreateTemporaryPasswordRequest>(
      '/temporary-password',
      {
        mutationFn: data => apiClient.post<TemporaryPasswordInfo>('/temporary-password', data),
        onSuccess: () => {
          // 刷新临时密码列表缓存
          queryClient.invalidateQueries({ queryKey: queryKeys.temporaryPasswords });
        },
      }
    );
  };

  // 删除临时密码
  const useDeleteTemporaryPassword = () => {
    const queryClient = useQueryClient();

    return useApiMutation<{ success: boolean }, string>('/temporary-password/delete', {
      mutationFn: id => apiClient.delete<{ success: boolean }>(`/temporary-password/${id}`),
      onSuccess: (_, variables) => {
        // 刷新临时密码列表缓存
        queryClient.invalidateQueries({ queryKey: queryKeys.temporaryPasswords });
        // 移除单个临时密码的缓存
        queryClient.removeQueries({ queryKey: queryKeys.temporaryPassword(variables) });
      },
    });
  };

  // 批量删除临时密码
  const useBatchDeleteTemporaryPasswords = () => {
    const queryClient = useQueryClient();

    return useApiMutation<{ deletedCount: number }, { ids: string[] }>(
      '/temporary-password/batch-delete',
      {
        mutationFn: data =>
          apiClient.delete<{ deletedCount: number }>('/temporary-password', {
            data,
          }),
        onSuccess: () => {
          // 刷新临时密码列表缓存
          queryClient.invalidateQueries({ queryKey: queryKeys.temporaryPasswords });
        },
      }
    );
  };

  // 验证临时密码
  const useValidateTemporaryPassword = () => {
    return useMutation({
      mutationFn: (data: { deviceId: string; password: string }) =>
        apiClient.post<{
          valid: boolean;
          passwordInfo?: TemporaryPasswordInfo;
          reason?: string;
        }>('/temporary-password/validate', data),
    });
  };

  return {
    // 查询
    useTemporaryPasswords,
    useTemporaryPassword,

    // 变更
    useCreateTemporaryPassword,
    useDeleteTemporaryPassword,
    useBatchDeleteTemporaryPasswords,
    useValidateTemporaryPassword,

    // 查询键（用于手动缓存操作）
    queryKeys,
  };
}
