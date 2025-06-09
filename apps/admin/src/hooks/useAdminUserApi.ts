import {
  AdminUserItem,
  CreateAdminUserType,
  UpdateAdminUserType,
  RoleItem,
} from '@smart-lock/shared';

import apiClient, { queryHooks } from '@/lib/aip-service';

/**
 * 用户管理API钩子
 * 提供用户管理的所有API操作和查询
 */
export function useUserApi() {
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    users: ['adminUser'] as const,
    user: (id: string) => ['adminUser', 'detail', id] as const,
    roles: ['roles'] as const,
  };

  // 用户相关查询和变更
  const useUsers = (params?: { page?: string; pageSize?: string }) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return useApiQuery<AdminUserItem[]>(queryKeys.users, `/adminUser/all${queryString}`);
  };

  const useUser = (id: string) => {
    return useApiQuery<AdminUserItem>(queryKeys.user(id), `/adminUser/${id}`);
  };

  const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AdminUserItem, CreateAdminUserType>('/adminUser', {
      mutationFn: data => apiClient.post<AdminUserItem>('/adminUser', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
      },
    });
  };

  const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AdminUserItem, { id: string; userData: UpdateAdminUserType }>(
      '/adminUser',
      {
        mutationFn: data => apiClient.patch<AdminUserItem>(`/adminUser/${data.id}`, data.userData),
        onSuccess: updatedUser => {
          queryClient.invalidateQueries({ queryKey: queryKeys.users });
          if (updatedUser.id) {
            queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
          }
        },
      }
    );
  };

  const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/adminUser', {
      mutationFn: id => apiClient.delete<void>(`/adminUser/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        queryClient.invalidateQueries({ queryKey: queryKeys.user(variables) });
      },
    });
  };

  // 角色查询（用于表单选择）
  const useRoles = () => {
    return useApiQuery<RoleItem[]>(queryKeys.roles, '/rbac/roles');
  };

  return {
    // 用户管理钩子
    useUsers,
    useUser,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,

    // 角色查询钩子
    useRoles,
  };
}
