import { useMutation } from '@tanstack/react-query';

import { useApi } from '../../contexts/api-context';
import { AuthorizedUser, Group } from '../../types/user-management';

import queryClient from '@/lib/queryClient';

/**
 * 用户管理API钩子
 * 提供用户管理模块的所有API操作和查询
 */
export function useUserManagementApi() {
  const { apiClient, queryHooks } = useApi();
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    users: ['users'] as const,
    user: (id: string) => ['user', 'detail', id] as const,
    groups: ['usergroups'] as const,
    group: (id: string) => ['userGroup', 'detail', id] as const,
  };

  // 用户相关查询和变更
  const useUsers = () => useApiQuery<AuthorizedUser[]>(queryKeys.users, '/friend/Allfriends');

  const useUser = (id: string) => useApiQuery<AuthorizedUser>(queryKeys.user(id), `/users/${id}`);

  const useCreateUser = () => {
    return useMutation({
      mutationFn: (data: Omit<AuthorizedUser, 'userId' | 'id'>) => {
        return apiClient.post<AuthorizedUser>('/friend', data);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
      },
    });
  };

  const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { id: string; userData: Partial<AuthorizedUser> }>(
      '/users/update',
      {
        mutationFn: data =>
          apiClient.put<AuthorizedUser>('/friend', {
            ...data.userData,
            id: data.id,
          }),
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

    return useApiMutation<void, string>('/friend', {
      mutationFn: id => apiClient.delete<void>(`/friend/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        queryClient.invalidateQueries({ queryKey: queryKeys.user(variables) });
      },
    });
  };

  // 群组相关查询和变更
  const useGroups = () => useApiQuery<Group[]>(queryKeys.groups, '/friend/groups');

  const useGroup = (id: string) => useApiQuery<Group>(queryKeys.group(id), `/friend/group/${id}`);

  const useCreateGroup = () => {
    const queryClient = useQueryClient();

    return useApiMutation<Group, Partial<Group>>('friend/group', {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      },
    });
  };

  const useUpdateGroup = () => {
    const queryClient = useQueryClient();

    return useApiMutation<Group, Partial<Group>>('/friend/group', {
      mutationFn: data => apiClient.put<Group>('/friend/group', data),
      onSuccess: updatedGroup => {
        queryClient.invalidateQueries({ queryKey: queryKeys.groups });
        if (updatedGroup.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.group(updatedGroup.id) });
        }
      },
    });
  };

  const useDeleteGroup = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/friend/group/delete', {
      mutationFn: id => apiClient.delete<void>(`/friend/group/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        queryClient.invalidateQueries({ queryKey: queryKeys.groups });
        queryClient.invalidateQueries({ queryKey: queryKeys.group(variables) });
      },
    });
  };

  // 用户身份验证相关变更
  const useUpdateUserNFC = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { userId: string; nfcData: string[] }>('/users/nfc', {
      onSuccess: updatedUser => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        if (updatedUser.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
        }
      },
    });
  };

  const useUpdateUserFingerprint = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { userId: string; fingerprintData: string[] }>(
      '/users/fingerprint',
      {
        onSuccess: updatedUser => {
          queryClient.invalidateQueries({ queryKey: queryKeys.users });
          if (updatedUser.id) {
            queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
          }
        },
      }
    );
  };

  const useUpdateUserFace = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { userId: string; faceData: string }>('/users/face', {
      onSuccess: updatedUser => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        if (updatedUser.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
        }
      },
    });
  };

  const useUpdateUserEyes = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { userId: string; eyesData: string[] }>('/users/eyes', {
      onSuccess: updatedUser => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        if (updatedUser.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
        }
      },
    });
  };

  const useUpdateUserDevices = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { userId: string; devices: string[] }>('/users/devices', {
      onSuccess: updatedUser => {
        queryClient.invalidateQueries({ queryKey: queryKeys.users });
        if (updatedUser.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
        }
      },
    });
  };

  const useUpdateUserLockPassword = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AuthorizedUser, { userId: string; password: string }>(
      '/users/lock-password',
      {
        onSuccess: updatedUser => {
          queryClient.invalidateQueries({ queryKey: queryKeys.users });
          if (updatedUser.id) {
            queryClient.invalidateQueries({ queryKey: queryKeys.user(updatedUser.id) });
          }
        },
      }
    );
  };

  // 创建用户管理资源钩子 - 使用类型断言来满足Record<string, unknown>约束
  const userResourceHooks = queryHooks.createResourceHooks<
    AuthorizedUser & Record<string, unknown>
  >('/users');
  const groupResourceHooks = queryHooks.createResourceHooks<Group & Record<string, unknown>>(
    '/groups'
  );

  return {
    // 查询钩子
    useUsers,
    useUser,
    useGroups,
    useGroup,

    // 变更钩子
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useCreateGroup,
    useUpdateGroup,
    useDeleteGroup,

    // 身份验证相关钩子
    useUpdateUserNFC,
    useUpdateUserFingerprint,
    useUpdateUserFace,
    useUpdateUserEyes,
    useUpdateUserDevices,
    useUpdateUserLockPassword,

    // 资源钩子
    userResourceHooks,
    groupResourceHooks,
  };
}
