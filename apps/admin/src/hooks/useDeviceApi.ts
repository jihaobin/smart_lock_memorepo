import type {
  CreateDeviceInput,
  UpdateDeviceInput,
  GetDeviceInput,
  AdminDevice,
} from '@smart-lock/shared';

import apiClient, { queryHooks } from '@/lib/aip-service';

/**
 * 设备管理API钩子
 * 提供设备管理的所有API操作和查询
 */
export function useDeviceApi() {
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    devices: ['devices'] as const,
    device: (id: string) => ['device', 'detail', id] as const,
  };

  // 设备相关查询和变更
  const useDevices = (params?: GetDeviceInput) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return useApiQuery<{
      items: AdminDevice[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(queryKeys.devices, `/device/all${queryString}`);
  };

  const useDevice = (id: string) => {
    return useApiQuery<AdminDevice>(queryKeys.device(id), `/device/${id}`);
  };

  const useCreateDevice = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AdminDevice, CreateDeviceInput>('/device', {
      mutationFn: data => apiClient.post<AdminDevice>('/device', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      },
    });
  };

  const useUpdateDevice = () => {
    const queryClient = useQueryClient();

    return useApiMutation<AdminDevice, { id: string; deviceData: UpdateDeviceInput }>('/device', {
      mutationFn: data => apiClient.patch<AdminDevice>(`/device/${data.id}`, data.deviceData),
      onSuccess: updatedDevice => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        if (updatedDevice.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.device(updatedDevice.id) });
        }
      },
    });
  };

  const useDeleteDevice = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/device', {
      mutationFn: id => apiClient.delete<void>(`/device/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        queryClient.invalidateQueries({ queryKey: queryKeys.device(variables) });
      },
    });
  };

  return {
    // 设备管理钩子
    useDevices,
    useDevice,
    useCreateDevice,
    useUpdateDevice,
    useDeleteDevice,
  };
}
