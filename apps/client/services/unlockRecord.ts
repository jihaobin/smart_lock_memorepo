import { DeviceUnlockRecordOpenType, DeviceUnlockRecordData } from '@smart-lock/shared';

import { useApi } from '@/contexts/api-context';

/**
 * 解锁记录项类型
 */
export interface UnlockRecord {
  id: string;
  deviceId: string;
  userId?: string;
  unlockType: DeviceUnlockRecordOpenType;
  timestamp: string;
  unlockData: DeviceUnlockRecordData;
  device?: {
    id: string;
    name: string;
  };
}

/**
 * 获取解锁记录列表的响应类型
 */
export interface UnlockRecordsResponse {
  items: UnlockRecord[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 解锁记录查询参数类型
 */
export interface UnlockRecordQueryParams {
  deviceId?: string;
  userId?: string;
  unlockType?: DeviceUnlockRecordOpenType;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 解锁记录服务类，提供与解锁记录相关的API请求方法
 */
export const useUnlockRecordService = () => {
  const { apiClient } = useApi();

  /**
   * 获取解锁记录列表
   * @param params 查询参数
   */
  const getUnlockRecords = async (params: UnlockRecordQueryParams) => {
    return apiClient.get<UnlockRecordsResponse>('/unlock-records', {
      params,
    });
  };

  /**
   * 获取单个解锁记录
   * @param id 记录ID
   */
  const getUnlockRecordById = async (id: string) => {
    return apiClient.get<UnlockRecord>(`/unlock-records/${id}`);
  };

  return {
    getUnlockRecords,
    getUnlockRecordById,
  };
};
