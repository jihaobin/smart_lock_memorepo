import {
  DeviceModel,
  DeviceModelListResponse,
  CreateDeviceModelInput,
  UpdateDeviceModelInput,
  GetDeviceModelsInput,
  AdjustStockInput,
  PaginatedData,
} from '@smart-lock/shared';

import apiClient, { queryHooks } from '@/lib/aip-service';
import { useInfiniteQuery } from '@tanstack/react-query';

/**
 * 设备型号管理API钩子
 * 提供设备型号的所有API操作和查询
 */
export function useDeviceModelApi() {
  const { useApiQuery, useApiMutation, useQueryClient } = queryHooks;

  // 定义查询键
  const queryKeys = {
    deviceModels: ['deviceModels'] as const,
    deviceModel: (id: string) => ['deviceModel', 'detail', id] as const,
  };

  // 设备型号相关查询和变更
  const useDeviceModels = (params?: GetDeviceModelsInput) => {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return useApiQuery<DeviceModelListResponse>(
      queryKeys.deviceModels,
      `/deviceModel${queryString}`
    );
  };

  // 无限滚动设备型号查询
  const useInfiniteDeviceModels = (params?: Omit<GetDeviceModelsInput, 'page'>) => {
    return useInfiniteQuery({
      queryKey: [...queryKeys.deviceModels, 'infinite', params],
      queryFn: async ({ pageParam = 1 }) => {
        const queryParams = {
          ...params,
          page: pageParam,
          limit: params?.limit || 20,
        };
        const queryString = `?${new URLSearchParams(queryParams as any).toString()}`;
        return apiClient.get<PaginatedData<DeviceModel>>(`/deviceModel${queryString}`);
      },
      getNextPageParam: lastPage => {
        const { page, totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
    });
  };

  const useDeviceModel = (id: string) => {
    return useApiQuery<DeviceModel>(queryKeys.deviceModel(id), `/deviceModel/${id}`);
  };

  const useCreateDeviceModel = () => {
    const queryClient = useQueryClient();

    return useApiMutation<DeviceModel, CreateDeviceModelInput>('/deviceModel', {
      mutationFn: data => apiClient.post<DeviceModel>('/deviceModel', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceModels });
      },
    });
  };

  const useUpdateDeviceModel = () => {
    const queryClient = useQueryClient();

    return useApiMutation<DeviceModel, { id: string; deviceModelData: UpdateDeviceModelInput }>(
      '/deviceModel',
      {
        mutationFn: data =>
          apiClient.put<DeviceModel>(`/deviceModel/${data.id}`, data.deviceModelData),
        onSuccess: updatedDeviceModel => {
          queryClient.invalidateQueries({ queryKey: queryKeys.deviceModels });
          if (updatedDeviceModel.id) {
            queryClient.invalidateQueries({
              queryKey: queryKeys.deviceModel(updatedDeviceModel.id),
            });
          }
        },
      }
    );
  };

  const useDeleteDeviceModel = () => {
    const queryClient = useQueryClient();

    return useApiMutation<void, string>('/deviceModel', {
      mutationFn: id => apiClient.delete<void>(`/deviceModel/${id}`),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceModels });
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceModel(variables) });
      },
    });
  };

  const useAdjustStock = () => {
    const queryClient = useQueryClient();

    return useApiMutation<DeviceModel, AdjustStockInput>('/deviceModel/adjust-stock', {
      mutationFn: data =>
        apiClient.post<DeviceModel>(`/deviceModel/${data.id}/adjust-stock`, {
          adjustment: data.adjustment,
        }),
      onSuccess: updatedDeviceModel => {
        queryClient.invalidateQueries({ queryKey: queryKeys.deviceModels });
        if (updatedDeviceModel.id) {
          queryClient.invalidateQueries({ queryKey: queryKeys.deviceModel(updatedDeviceModel.id) });
        }
      },
    });
  };

  return {
    // 设备型号管理钩子
    useDeviceModels,
    useInfiniteDeviceModels,
    useDeviceModel,
    useCreateDeviceModel,
    useUpdateDeviceModel,
    useDeleteDeviceModel,
    useAdjustStock,
  };
}
