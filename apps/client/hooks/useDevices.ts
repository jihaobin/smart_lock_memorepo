import { useCallback } from 'react';

import { useDeviceManagementApi } from './api/useDeviceManagementApi';
import { useToast } from './use-toast';

import type { Device } from '@/types/device-management';
import { getDeviceDisplayName } from '@/utils/device-utils';

/**
 * 设备数据和操作钩子
 * 管理设备数据的获取、过滤和操作
 */
export function useDevices() {
  const { toast } = useToast();
  const deviceManagementApi = useDeviceManagementApi();

  // 查询设备数据
  const { data: devices = [], isLoading, refetch } = deviceManagementApi.useDevices();

  // 变更状态
  const { mutateAsync: bindDeviceMutation, isPending: isBinding } =
    deviceManagementApi.useBindDevice();
  const { mutateAsync: updateDeviceMutation, isPending: isUpdating } =
    deviceManagementApi.useUpdateDevice();
  const { mutateAsync: deleteDeviceMutation, isPending: isDeleting } =
    deviceManagementApi.useDeleteDevice();
  const { mutateAsync: updateStatusMutation } = deviceManagementApi.useUpdateDeviceStatus();
  const { mutateAsync: updateNameMutation } = deviceManagementApi.useUpdateDeviceName();
  const { mutateAsync: assignToGroupMutation } = deviceManagementApi.useAssignDeviceToGroup();
  const { mutateAsync: remoteUnlockMutation, isPending: isUnlocking } =
    deviceManagementApi.useRemoteUnlock();

  // 过滤设备
  const filterDevices = useCallback(
    (searchText: string, groupId: string | null) => {
      return devices.filter(device => {
        const matchesSearch = getDeviceDisplayName(device)
          .toLowerCase()
          .includes(searchText.toLowerCase());
        const matchesGroup = !groupId || device.groupId === groupId;
        return matchesSearch && matchesGroup;
      });
    },
    [devices]
  );

  // 绑定设备
  const createDevice = async (deviceId: string) => {
    try {
      const newDevice = await bindDeviceMutation(deviceId);
      toast({
        title: '设备已绑定',
        description: `设备已成功绑定到您的账户。`,
      });
      return newDevice;
    } catch (error) {
      console.error('绑定设备失败:', error);
      toast({
        title: '绑定设备失败',
        description: '添加设备时发生错误，请稍后重试。',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 更新设备
  const updateDevice = async (id: string, deviceData: Partial<Device>) => {
    try {
      const updatedDevice = await updateDeviceMutation({ id, deviceData });
      toast({
        title: '设备已更新',
        description: '设备信息已成功更新。',
      });
      return updatedDevice;
    } catch (error) {
      console.error('更新设备失败:', error);
      toast({
        title: '更新设备失败',
        description: '更新设备时发生错误，请稍后重试。',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 删除设备
  const deleteDevice = async (id: string, deviceName: string) => {
    try {
      await deleteDeviceMutation(id);
      toast({
        title: '设备已解绑',
        description: `设备 "${deviceName}" 已成功解绑。`,
      });
    } catch (error) {
      console.error('解绑设备失败:', error);
      toast({
        title: '解绑设备失败',
        description: '解绑设备时发生错误，请稍后重试。',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 远程开锁
  const remoteUnlock = async (deviceId: string) => {
    try {
      const result = await remoteUnlockMutation(deviceId);
      if (result.success) {
        toast({
          title: '开锁命令已发送',
          description: '请等待设备执行开锁操作',
        });
      } else {
        toast({
          title: '开锁操作失败',
          description: result.message || '无法发送远程开锁命令，请稍后重试',
          variant: 'destructive',
        });
      }
      return result;
    } catch (error) {
      console.error('远程开锁失败:', error);
      toast({
        title: '发送开锁命令失败',
        description: '远程开锁请求发送失败，请稍后重试',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 设备操作方法
  const operations = {
    // 更新设备状态（锁定/解锁）
    updateDeviceStatus: async (deviceId: string, status: 'locked' | 'unlocked') => {
      try {
        const updatedDevice = await updateStatusMutation({ deviceId, status });
        toast({
          title: '设备状态已更新',
          description: `设备已${status === 'locked' ? '锁定' : '解锁'}。`,
        });
        return updatedDevice;
      } catch (error) {
        console.error('更新设备状态失败:', error);
        toast({
          title: '更新状态失败',
          description: '更新设备状态时发生错误，请稍后重试。',
          variant: 'destructive',
        });
        throw error;
      }
    },

    // 更新设备名称
    updateDeviceName: async (deviceId: string, name: string) => {
      try {
        const updatedDevice = await updateNameMutation({ deviceId, name });
        toast({
          title: '设备名称已更新',
          description: `设备名称已更改为 "${name}"。`,
        });
        return updatedDevice;
      } catch (error) {
        console.error('更新设备名称失败:', error);
        toast({
          title: '更新名称失败',
          description: '更新设备名称时发生错误，请稍后重试。',
          variant: 'destructive',
        });
        throw error;
      }
    },

    // 更新设备所属分组
    updateDeviceGroup: async (deviceId: string, groupId: string) => {
      try {
        const updatedDevice = await assignToGroupMutation({ deviceId, groupId });
        toast({
          title: '设备分组已更新',
          description: '设备已成功移动到新分组。',
        });
        return updatedDevice;
      } catch (error) {
        console.error('更新设备分组失败:', error);
        toast({
          title: '更新分组失败',
          description: '更新设备分组时发生错误，请稍后重试。',
          variant: 'destructive',
        });
        throw error;
      }
    },
  };

  // 根据设备ID获取设备名称
  const getDeviceNameById = (id: string) => {
    const findDevice = devices.find(item => {
      return item.id === id;
    });
    if (!findDevice) {
      return undefined;
    }
    return getDeviceDisplayName(findDevice);
  };

  return {
    // 数据
    devices,
    filterDevices,

    // 方法
    createDevice,
    updateDevice,
    deleteDevice,
    remoteUnlock,
    operations,
    refetch,
    getDeviceNameById,

    // 状态
    status: {
      isLoading,
      isUnlocking,
      isMutating: isBinding || isUpdating || isDeleting || isUnlocking,
    },
  };
}
