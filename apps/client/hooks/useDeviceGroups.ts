import { useMemo } from 'react';

import { useDeviceManagementApi } from './api/useDeviceManagementApi';
import { useToast } from './use-toast';

import type { DeviceGroup } from '@/types/device-management';

/**
 * 设备组数据和操作钩子
 * 管理设备组数据的获取和操作
 */
export function useDeviceGroups() {
  const { toast } = useToast();
  const deviceManagementApi = useDeviceManagementApi();

  // 查询设备组数据
  const { data: groups = [], isLoading, refetch } = deviceManagementApi.useDeviceGroups();

  // 变更状态
  const { mutateAsync: createGroupMutation, isPending: isCreating } =
    deviceManagementApi.useCreateDeviceGroup();
  const { mutateAsync: updateGroupMutation, isPending: isUpdating } =
    deviceManagementApi.useUpdateDeviceGroup();
  const { mutateAsync: deleteGroupMutation, isPending: isDeleting } =
    deviceManagementApi.useDeleteDeviceGroup();

  // 创建设备组名称映射
  const groupNameMap = useMemo(() => {
    return groups.reduce<Record<string, string>>((map, group) => {
      map[group.id] = group.name;
      return map;
    }, {});
  }, [groups]);

  // 创建设备组
  const createGroup = async (groupData: { name: string }) => {
    try {
      const newGroup = await createGroupMutation({ groupName: groupData.name });
      toast({
        title: '分组已创建',
        description: `设备分组 "${groupData.name}" 已成功创建。`,
      });
      return newGroup;
    } catch (error) {
      console.error('创建分组失败:', error);
      toast({
        title: '创建分组失败',
        description: '添加分组时发生错误，请稍后重试。',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 更新设备组
  const updateGroup = async (groupData: DeviceGroup) => {
    try {
      const updatedGroup = await updateGroupMutation({
        id: groupData.id,
        groupName: groupData.name,
      });
      toast({
        title: '分组已更新',
        description: `设备分组 "${groupData.name}" 已成功更新。`,
      });
      return updatedGroup;
    } catch (error) {
      console.error('更新分组失败:', error);
      toast({
        title: '更新分组失败',
        description: '更新分组时发生错误，请稍后重试。',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 删除设备组
  const deleteGroup = async (id: string, groupName: string) => {
    try {
      await deleteGroupMutation(id);
      toast({
        title: '分组已删除',
        description: `设备分组 "${groupName}" 已成功删除。`,
      });
    } catch (error) {
      console.error('删除分组失败:', error);
      toast({
        title: '删除分组失败',
        description: '删除分组时发生错误，请稍后重试。',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 过滤设备组
  const filterGroups = (searchText: string) => {
    if (!searchText) return groups;
    return groups.filter(group => group.name.toLowerCase().includes(searchText.toLowerCase()));
  };

  return {
    // 数据
    groups,
    filterGroups,
    groupNameMap,

    // 方法
    createGroup,
    updateGroup,
    deleteGroup,
    refetch,

    // 状态
    status: {
      isLoading,
      isMutating: isCreating || isUpdating || isDeleting,
    },
  };
}
