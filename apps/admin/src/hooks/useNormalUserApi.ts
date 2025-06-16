import { UserItem, GetAllUsersType, GetAllUsersResponse, PaginatedData } from '@smart-lock/shared';

import apiClient, { queryHooks } from '@/lib/aip-service';
import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * 普通用户管理API钩子
 * 提供普通用户管理的所有API操作和查询
 */
export function useNormalUserApi() {
  const { useApiQuery } = queryHooks;

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

  // 无限滚动用户查询
  const useInfiniteUsers = (params?: Omit<GetAllUsersType, 'page'>) => {
    return useInfiniteQuery({
      queryKey: [...queryKeys.users, 'infinite', params],
      queryFn: async ({ pageParam = 1 }) => {
        const queryParams = {
          ...params,
          page: pageParam,
          limit: params?.pageSize || 20,
        };
        const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
        return apiClient.get<PaginatedData<UserItem>>(`/user/all${queryString}`);
      },
      getNextPageParam: lastPage => {
        const { page, totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
    });
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
    useInfiniteUsers,
    useUser,
    useUserByPhone,
  };
}
