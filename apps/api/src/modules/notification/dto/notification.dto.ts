import {
  CreateNotificationSchema,
  GetNotificationsSchema,
} from '@smart-lock/shared';
import z from 'zod/v4';

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;

export type GetNotificationsDto = z.infer<typeof GetNotificationsSchema>;

/**
 * 通知发送记录类型接口
 */
export interface DeliveryLogType {
  id: string;
  notificationId: string;
  deliveryMethod: 'sms' | 'call' | 'app';
  targetNumber: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  errorMessage?: string;
  attemptTime: Date;
  completionTime?: Date;
  retryCount: number;
  aliYunMsgId?: string;
  maxDeliveryTime?: Date;
}

/**
 * 通知记录类型接口
 */
export interface NotificationType {
  id: string;
  userId: string;
  type: string;
  message: string;
  data: Record<string, unknown>;
  deviceId: string | null;
  importanceLevel: 'low' | 'medium' | 'high' | 'critical';
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  notificationMethod: 'app' | 'sms' | 'call';
  timestamp: Date;
}
