import type {
  RouteItem,
  RoleItem,
  CreateRouteDto,
  UpdateRouteDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '@smart-lock/shared';

import apiClient, { queryHooks } from '@/lib/aip-service';

/**
 * RBAC管理API钩子
 * 提供角色、路由和权限管理的所有API操作和查询
 */
export function useRbacApi() {
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    roles: ['roles'] as const,
    role: (id: string) => ['role', 'detail', id] as const,
    routes: ['routes'] as const,
    route: (id: string) => ['route', 'detail', id] as const,
    roleRoutes: (roleId: string) => ['role', roleId, 'routes'] as const,
    userRoles: (userId: string) => ['user', userId, 'roles'] as const,
    userAccessibleRoutes: (userId: string) => ['user', userId, 'accessible-routes'] as const,
  };

  // 角色相关查询和变更
  const useRoles = () => {
    return useApiQuery<RoleItem[]>(queryKeys.roles, '/rbac/roles');
  };

  const useRole = (id: string) => {
    return useApiQuery<RoleItem>(queryKeys.role(id), `/rbac/roles/${id}`);
  };

  const useCreateRole = () => {
    const queryClient = useQueryClient();

    return useApiMutation<RoleItem, CreateRoleDto>('/rbac/roles', {
      mutationFn: data => apiClient.post<RoleItem>('/rbac/roles', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      },
    });
  };

  const useUpdateRole = () => {
    const queryClient = useQueryClient();

    return useApiMutation<RoleItem, { id: string; roleData: UpdateRoleDto }>('/rbac/roles', {
      mutationFn: data => apiClient.put<RoleItem>(`/rbac/roles/${data.id}`, data.roleData),
      onSuccess: updatedRole => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        if (updatedRole.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.role(updatedRole.id) });
        }
      },
    });
  };

  const useDeleteRole = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/rbac/roles', {
      mutationFn: id => apiClient.delete<void>(`/rbac/roles/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
        queryClient.invalidateQueries({ queryKey: queryKeys.role(variables) });
        // 清除相关的角色路由缓存
        queryClient.invalidateQueries({ queryKey: queryKeys.roleRoutes(variables) });
      },
    });
  };

  // 路由相关查询和变更
  const useRoutes = (params?: { page?: string; pageSize?: string }) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return useApiQuery<RouteItem[]>(queryKeys.routes, `/rbac/routes${queryString}`);
  };

  const useRoute = (id: string) => {
    return useApiQuery<RouteItem>(queryKeys.route(id), `/rbac/routes/${id}`);
  };

  const useCreateRoute = () => {
    const queryClient = useQueryClient();

    return useApiMutation<RouteItem, CreateRouteDto>('/rbac/routes', {
      mutationFn: data => apiClient.post<RouteItem>('/rbac/routes', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.routes });
      },
    });
  };

  const useUpdateRoute = () => {
    const queryClient = useQueryClient();

    return useApiMutation<RouteItem, { id: string; routeData: UpdateRouteDto }>('/rbac/routes', {
      mutationFn: data => apiClient.put<RouteItem>(`/rbac/routes/${data.id}`, data.routeData),
      onSuccess: updatedRoute => {
        queryClient.invalidateQueries({ queryKey: queryKeys.routes });
        if (updatedRoute.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.route(updatedRoute.id) });
        }
      },
    });
  };

  const useDeleteRoute = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/rbac/routes', {
      mutationFn: id => apiClient.delete<void>(`/rbac/routes/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.routes });
        queryClient.invalidateQueries({ queryKey: queryKeys.route(variables) });
      },
    });
  };

  // 角色路由关联
  const useAssignRoutesToRole = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, { roleId: string; routeIds: string[] }>('/rbac/roles/routes', {
      mutationFn: data =>
        apiClient.post<void>(`/rbac/roles/${data.roleId}/routes`, { routeIds: data.routeIds }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.roleRoutes(variables.roleId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.roles });
      },
    });
  };

  const useRoleRoutes = (roleId: string) => {
    return useApiQuery<RouteItem[]>(queryKeys.roleRoutes(roleId), `/rbac/roles/${roleId}/routes`);
  };

  // 用户角色关联
  const useAssignRolesToUser = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, { userId: string; roleIds: string[] }>('/rbac/users/roles', {
      mutationFn: data =>
        apiClient.post<void>(`/rbac/users/${data.userId}/roles`, { roleIds: data.roleIds }),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.userRoles(variables.userId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.userAccessibleRoutes(variables.userId),
        });
      },
    });
  };

  const useUserRoles = (userId: string) => {
    return useApiQuery<RoleItem[]>(queryKeys.userRoles(userId), `/rbac/users/${userId}/roles`);
  };

  const useUserAccessibleRoutes = (userId: string) => {
    return useApiQuery<RouteItem[]>(
      queryKeys.userAccessibleRoutes(userId),
      `/rbac/users/${userId}/accessible-routes`
    );
  };

  return {
    // 角色管理钩子
    useRoles,
    useRole,
    useCreateRole,
    useUpdateRole,
    useDeleteRole,

    // 路由管理钩子
    useRoutes,
    useRoute,
    useCreateRoute,
    useUpdateRoute,
    useDeleteRoute,

    // 权限关联钩子
    useAssignRoutesToRole,
    useRoleRoutes,
    useAssignRolesToUser,
    useUserRoles,
    useUserAccessibleRoutes,
  };
}
