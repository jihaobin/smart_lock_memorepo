import {
  baseNotificationDataSchema,
  NOTIFICATION_ENUM,
  IMPORTANCE_LEVEL
} from '@smart-lock/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// 创建通知的基础DTO
export const CreateNotificationSchema = baseNotificationDataSchema.extend({
  data: z.record(z.unknown()).optional(),
  importanceLevel: z.enum([
    IMPORTANCE_LEVEL.LOW,
    IMPORTANCE_LEVEL.MEDIUM,
    IMPORTANCE_LEVEL.HIGH,
    IMPORTANCE_LEVEL.CRITICAL,
  ], { message: '重要级别不符合要求' }).default(IMPORTANCE_LEVEL.MEDIUM),
  notificationMethod: z.enum(['app', 'sms', 'call']).default('app'),
});

export class CreateNotificationDto extends createZodDto(CreateNotificationSchema) {}

// 查询通知列表的DTO
export const GetNotificationsSchema = z.object({
  userId: z.string().min(1, { message: '用户ID不能为空' }),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  type: z.enum([
    NOTIFICATION_ENUM.DOORBELL,
    NOTIFICATION_ENUM.DOOR_OPEN_ALERT,
    NOTIFICATION_ENUM.DEVICE_LOW_BATTERY,
    NOTIFICATION_ENUM.DEVICE_BROKEN,
    NOTIFICATION_ENUM.DEVICE_OPEN,
    NOTIFICATION_ENUM.DEVICE_CLOSE,
    NOTIFICATION_ENUM.DEVICE_OFFLINE,
    NOTIFICATION_ENUM.DEVICE_ONLINE,
    NOTIFICATION_ENUM.FIRMWARE_UPDATE,
  ]).optional(),
  deviceId: z.string().optional(),
  importanceLevel: z.enum([
    IMPORTANCE_LEVEL.LOW,
    IMPORTANCE_LEVEL.MEDIUM,
    IMPORTANCE_LEVEL.HIGH,
    IMPORTANCE_LEVEL.CRITICAL,
  ]).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export class GetNotificationsDto extends createZodDto(GetNotificationsSchema) {}

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