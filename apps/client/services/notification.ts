import { NotiFIcationListItem, GetNotificationsSchema } from '@smart-lock/shared';
import { z } from 'zod';

import { useApi } from '@/contexts/api-context';

/**
 * 获取通知列表的响应类型
 */
export interface NotificationsResponse {
  items: NotiFIcationListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 通知服务类，提供与通知相关的API请求方法
 */
export const useNotificationService = () => {
  const { apiClient } = useApi();

  /**
   * 获取通知列表
   * @param params 查询参数
   */
  const getNotifications = async (params: z.infer<typeof GetNotificationsSchema>) => {
    return apiClient.get<NotificationsResponse>('/notifications', {
      params,
    });
  };

  /**
   * 将所有通知标记为已读
   */
  const markAllAsRead = async () => {
    return apiClient.post('/notifications/mark-all-read');
  };

  return {
    getNotifications,
    markAllAsRead,
  };
};
