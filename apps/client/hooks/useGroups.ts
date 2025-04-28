import { useMemo } from 'react';

import { useUserManagementApi } from './api/useUserManagementApi';
import { useToast } from './use-toast';

import type { Group } from '@/types/user-management';

/**
 * 用户组管理钩子 - 专注于用户组数据的管理
 * 包含用户组列表查询、CRUD 操作等功能
 */
export function useGroups() {
  const { toast } = useToast();

  // 获取API钩子
  const {
    useGroups: useGroupsQuery,
    useCreateGroup,
    useUpdateGroup,
    useDeleteGroup,
  } = useUserManagementApi();

  // 用户组数据查询
  const { data: groups = [], isLoading, isError, error, refetch } = useGroupsQuery();

  // 变更操作
  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();
  const deleteGroupMutation = useDeleteGroup();

  /**
   * 过滤用户组列表
   */
  const filterGroups = (searchText: string) => {
    return groups.filter(
      group => searchText === '' || group.groupName.toLowerCase().includes(searchText.toLowerCase())
    );
  };

  /**
   * 创建新用户组
   */
  const createGroup = async (groupData: Partial<Group>) => {
    try {
      const result = createGroupMutation.mutate(groupData, {
        onSuccess: data => {
          toast({
            title: '用户组已创建',
            description: `用户组 "${data.groupName}" 已成功创建。`,
          });
        },
      });
      return result;
    } catch (error) {
      console.error('创建用户组失败:', error);
      toast({
        title: '创建用户组失败',
        description: '创建用户组时发生错误，请稍后重试。',
      });
      throw error;
    }
  };

  /**
   * 更新用户组信息
   */
  const updateGroup = (groupData: Partial<Group>) => {
    try {
      const result = updateGroupMutation.mutate(groupData, {
        onSuccess: data => {
          toast({
            title: '用户组已更新',
            description: `用户组 "${data.groupName}" 的信息已成功更新。`,
          });
        },
      });

      return result;
    } catch (error) {
      console.error('更新用户组失败:', error);
      toast({
        title: '更新用户组失败',
        description: '更新用户组信息时发生错误，请稍后重试。',
      });
      throw error;
    }
  };

  /**
   * 删除用户组
   */
  const deleteGroup = async (id: string, groupName: string) => {
    try {
      deleteGroupMutation.mutate(id, {
        onSuccess: () => {
          toast({
            title: '用户组已删除',
            description: `用户组 "${groupName}" 已成功删除。`,
          });
        },
      });
    } catch (error) {
      console.error('删除用户组失败:', error);
      toast({
        title: '删除用户组失败',
        description: '删除用户组时发生错误，请稍后重试。',
      });
      throw error;
    }
  };

  // 加载和错误状态
  const status = useMemo(
    () => ({
      isLoading,
      isError,
      error,
      isMutating:
        createGroupMutation.isPending ||
        updateGroupMutation.isPending ||
        deleteGroupMutation.isPending,
    }),
    [
      isLoading,
      isError,
      error,
      createGroupMutation.isPending,
      updateGroupMutation.isPending,
      deleteGroupMutation.isPending,
    ]
  );

  // 获取组名称映射（用于显示组名）
  const groupNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    groups.forEach(group => {
      map[group.id] = group.groupName;
    });
    return map;
  }, [groups]);

  return {
    // 数据
    groups,
    groupNameMap,

    // 方法
    filterGroups,
    createGroup,
    updateGroup,
    deleteGroup,

    // 状态
    status,

    // 刷新
    refetch,
  };
}
