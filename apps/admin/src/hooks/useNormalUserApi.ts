import {
  UserItem,
  GetAllUsersType,
  GetAllUsersResponse,
  GetUserByPhoneType,
} from '@smart-lock/shared';

import apiClient, { queryHooks } from '@/lib/aip-service';

/**
 * 普通用户管理API钩子
 * 提供普通用户管理的所有API操作和查询
 */
export function useNormalUserApi() {
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    users: ['normalUser'] as const,
    user: (id: string) => ['normalUser', 'detail', id] as const,
    userByPhone: (phone: string) => ['normalUser', 'phone', phone] as const,
  };

  // 用户相关查询
  const useUsers = (params?: GetAllUsersType) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return useApiQuery<GetAllUsersResponse>(queryKeys.users, `/user/all${queryString}`);
  };

  const useUser = (id: string) => {
    return useApiQuery<UserItem>(queryKeys.user(id), `/user/${id}`);
  };

  const useUserByPhone = (phone: string) => {
    return useApiQuery<UserItem>(queryKeys.userByPhone(phone), `/user/phone/${phone}`);
  };

  return {
    // 用户查询钩子
    useUsers,
    useUser,
    useUserByPhone,
  };
}
