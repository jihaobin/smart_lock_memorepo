import { useMutation } from '@tanstack/react-query';

import { useApi } from '../../contexts/ApiContext';
import type { Device, DeviceGroup } from '../../types/device-management';

import queryClient from '@/lib/queryClient';
import { createFrontendDevice } from '@/utils/device-utils';

/**
 * 设备管理API钩子
 * 提供设备管理模块的所有API操作和查询
 */
export function useDeviceManagementApi() {
  const { apiClient, queryHooks } = useApi();
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    devices: ['devices'] as const,
    device: (id: string) => ['device', 'detail', id] as const,
    deviceGroups: ['deviceGroups'] as const,
    deviceGroup: (id: string) => ['deviceGroup', 'detail', id] as const,
    devicesWithGroups: ['devicesWithGroups'] as const,
  };

  // 设备相关查询和变更
  const useDevices = () => {
    const query = useApiQuery<Device[]>(queryKeys.devices, '/device/all');

    // 转换后端数据为前端格式
    return {
      ...query,
      data: query.data?.map(createFrontendDevice) || [],
    };
  };

  const useDevicesWithGroups = () => {
    const query = useApiQuery<{ devices: Device[]; id: string; name: string }[]>(
      queryKeys.devicesWithGroups,
      '/device/with-groups'
    );

    // 转换为前端格式
    return {
      ...query,
      data:
        query.data?.map(group => ({
          id: group.id,
          name: group.name,
          devices: group.devices.map(createFrontendDevice) || [],
        })) || [],
    };
  };

  const useDevice = (id: string) => {
    const query = useApiQuery<Device>(queryKeys.device(id), `/device/${id}`);

    return {
      ...query,
      data: query.data ? createFrontendDevice(query.data) : undefined,
    };
  };

  const useBindDevice = () => {
    return useMutation({
      mutationFn: (deviceId: string) => {
        return apiClient.post<Device>(`/device/bind/${deviceId}`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
      },
    });
  };

  const useUpdateDevice = () => {
    const queryClient = useQueryClient();

    return useApiMutation<Device, { id: string; deviceData: Partial<Device> }>('/device/update', {
      mutationFn: data =>
        apiClient.put<Device>('/device/update', {
          ...data.deviceData,
          id: data.id,
        }),
      onSuccess: updatedDevice => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
        if (updatedDevice.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.device(updatedDevice.id) });
        }
      },
    });
  };

  const useDeleteDevice = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/device/unbind', {
      mutationFn: id => apiClient.delete<void>(`/device/unbind/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
        queryClient.invalidateQueries({ queryKey: queryKeys.device(variables) });
      },
    });
  };

  // 设备组相关查询和变更
  const useDeviceGroups = () => {
    return useApiQuery<DeviceGroup[]>(queryKeys.deviceGroups, '/device/groups');
  };

  const useDevicesByGroupId = (groupId: string) => {
    const query = useApiQuery<Device[]>(
      [...queryKeys.deviceGroups, groupId],
      `/device/group/${groupId}`
    );

    // 转换为前端格式
    return {
      ...query,
      data: query.data?.map(createFrontendDevice) || [],
    };
  };

  const useCreateDeviceGroup = () => {
    const queryClient = useQueryClient();

    return useApiMutation<DeviceGroup, { groupName: string }>('/device/group', {
      mutationFn: data =>
        apiClient.post<DeviceGroup>('/device/group', { groupName: data.groupName }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceGroups });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
      },
    });
  };

  const useUpdateDeviceGroup = () => {
    const queryClient = useQueryClient();

    return useApiMutation<DeviceGroup, { id: string; groupName: string }>('/device/group', {
      mutationFn: data =>
        apiClient.put<DeviceGroup>('/device/group', {
          id: data.id,
          groupName: data.groupName,
        }),
      onSuccess: updatedGroup => {
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceGroups });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
        if (updatedGroup.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.deviceGroup(updatedGroup.id) });
        }
      },
    });
  };

  const useDeleteDeviceGroup = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/device/group', {
      mutationFn: id => apiClient.delete<void>(`/device/group/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceGroups });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceGroup(variables) });
      },
    });
  };

  // 设备操作相关变更
  const useUpdateDeviceStatus = () => {
    const queryClient = useQueryClient();

    // 后端可能需要适当的接口，这里暂时用默认路径
    return useApiMutation<Device, { deviceId: string; status: 'locked' | 'unlocked' }>(
      '/device/status',
      {
        onSuccess: updatedDevice => {
          queryClient.invalidateQueries({ queryKey: queryKeys.devices });
          queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
          if (updatedDevice.id) {
            queryClient.invalidateQueries({ queryKey: queryKeys.device(updatedDevice.id) });
          }
        },
      }
    );
  };

  const useUpdateDeviceName = () => {
    const queryClient = useQueryClient();

    // 后端可能需要适当的接口，这里暂时用默认路径
    return useApiMutation<Device, { deviceId: string; name: string }>('/device/name', {
      onSuccess: updatedDevice => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
        if (updatedDevice.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.device(updatedDevice.id) });
        }
      },
    });
  };

  const useAssignDeviceToGroup = () => {
    const queryClient = useQueryClient();

    // 后端可能需要适当的接口，这里暂时用默认路径
    return useApiMutation<Device, { deviceId: string; groupId: string }>(
      '/device/group-assignment',
      {
        onSuccess: updatedDevice => {
          queryClient.invalidateQueries({ queryKey: queryKeys.devices });
          queryClient.invalidateQueries({ queryKey: queryKeys.deviceGroups });
          queryClient.invalidateQueries({ queryKey: queryKeys.devicesWithGroups });
          if (updatedDevice.id) {
            queryClient.invalidateQueries({ queryKey: queryKeys.device(updatedDevice.id) });
          }
        },
      }
    );
  };

  return {
    // 查询钩子
    useDevices,
    useDevicesWithGroups,
    useDevice,
    useDeviceGroups,
    useDevicesByGroupId,

    // 变更钩子
    useBindDevice,
    useUpdateDevice,
    useDeleteDevice,
    useCreateDeviceGroup,
    useUpdateDeviceGroup,
    useDeleteDeviceGroup,

    // 设备操作钩子
    useUpdateDeviceStatus,
    useUpdateDeviceName,
    useAssignDeviceToGroup,
  };
}
