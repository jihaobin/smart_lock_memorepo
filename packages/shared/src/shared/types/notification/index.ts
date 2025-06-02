import { z } from 'zod';

import { Device } from '../device';
import { deviceUnlockRecordDataSchema } from '../unlockRecord';

export const NOTIFICATION_ENUM = {
  DOORBELL: 'doorbell', // 门铃
  DOOR_OPEN_ALERT: 'device_open_alert', // 长时间没有关门
  DEVICE_LOW_BATTERY: 'device_low_battery', // 电量低
  DEVICE_BROKEN: 'device_broken', // 门被破坏
  DEVICE_OPEN: 'device_open', // 开门
  DEVICE_CLOSE: 'device_close', // 关门
  DEVICE_OFFLINE: 'device_offline', // 设备离线
  DEVICE_ONLINE: 'device_online', // 设备上线
  FIRMWARE_UPDATE: 'firmware_update', // 固件更新
} as const;

export type NOTIFICATION_ENUM = typeof NOTIFICATION_ENUM;

export const OPEN_TYPE_ENUM = {
  REMOTE: 'remote', // 远程
  TEMPORARY_PASSWORD: 'temporary_password', // 临时密码
  KEY: 'key', // 钥匙
  NFC: 'nfc', // NFC
  PERMANENT_PASSWORD: 'permanent_password', // 永久密码
  FACE: 'face', // 人脸
  EYE: 'eye', // 瞳孔
  FINGERPRINT: 'fingerprint', // 指纹
} as const;

export type OPEN_TYPE_ENUM = typeof OPEN_TYPE_ENUM;

export const IMPORTANCE_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical', // // 低，中，高，紧急
} as const;

export type IMPORTANCE_LEVEL = typeof IMPORTANCE_LEVEL;

export const NotificaitonItemSchema = z.object({
  device_battery: z.number().optional(),
  device_firmware_version: z.string().optional(),
  openType: z
    .union([
      z.literal('remote'),
      z.literal('temporary_password'),
      z.literal('key'),
      z.literal('nfc'),
      z.literal('permanent_password'),
      z.literal('face'),
      z.literal('eye'),
      z.literal('fingerprint'),
    ])
    .optional(),
  openFriend: z.string().optional(),
  noOpenTime: z.number().optional(),
});

export const baseNotificationDataSchema = z.object({
  userId: z.string().min(1, { message: '用户ID不能为空' }),
  deviceId: z.string().min(1, { message: '设备ID不能为空' }),
  message: z.string().min(1, { message: '消息不能为空' }).optional(), // 消息字段改为可选，将由系统根据type自动生成
  type: z.enum(
    [
      NOTIFICATION_ENUM.DOORBELL, // 门铃
      NOTIFICATION_ENUM.DOOR_OPEN_ALERT, // 长时间没有关门
      NOTIFICATION_ENUM.DEVICE_LOW_BATTERY, // 电量低
      NOTIFICATION_ENUM.DEVICE_BROKEN, // 门被破坏
      NOTIFICATION_ENUM.DEVICE_OPEN, // 开门
      NOTIFICATION_ENUM.DEVICE_CLOSE, // 关门
      NOTIFICATION_ENUM.DEVICE_OFFLINE, // 设备离线
      NOTIFICATION_ENUM.DEVICE_ONLINE, // 设备上线
      NOTIFICATION_ENUM.FIRMWARE_UPDATE, // 固件更新
    ],
    { message: '消息类型不符合要求' }
  ),
});

// 创建通知的基础DTO
export const CreateNotificationSchema = baseNotificationDataSchema.extend({
  data: z.object({
    ...NotificaitonItemSchema.shape,
    unlockData: z
      .object({
        ...deviceUnlockRecordDataSchema.shape,
      })
      .optional(),
  }),
  importanceLevel: z
    .enum(
      [
        IMPORTANCE_LEVEL.LOW,
        IMPORTANCE_LEVEL.MEDIUM,
        IMPORTANCE_LEVEL.HIGH,
        IMPORTANCE_LEVEL.CRITICAL,
      ],
      { message: '重要级别不符合要求' }
    )
    .optional(), // 改为可选，将由系统根据type自动确定
});

export const GetNotificationsSchema = z.object({
  page: z
    .string()
    .default('1')
    .transform(value => String(value)),
  limit: z
    .string()
    .default('10')
    .transform(value => String(value)),
  type: z
    .enum([
      NOTIFICATION_ENUM.DOORBELL,
      NOTIFICATION_ENUM.DOOR_OPEN_ALERT,
      NOTIFICATION_ENUM.DEVICE_LOW_BATTERY,
      NOTIFICATION_ENUM.DEVICE_BROKEN,
      NOTIFICATION_ENUM.DEVICE_OPEN,
      NOTIFICATION_ENUM.DEVICE_CLOSE,
      NOTIFICATION_ENUM.DEVICE_OFFLINE,
      NOTIFICATION_ENUM.DEVICE_ONLINE,
      NOTIFICATION_ENUM.FIRMWARE_UPDATE,
    ])
    .optional(),
  deviceId: z.string().optional(),
  importanceLevel: z
    .enum([
      IMPORTANCE_LEVEL.LOW,
      IMPORTANCE_LEVEL.MEDIUM,
      IMPORTANCE_LEVEL.HIGH,
      IMPORTANCE_LEVEL.CRITICAL,
    ])
    .optional(),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const deviceOpenNotificationDataSchema = baseNotificationDataSchema.extend({
  openType: z.enum([
    OPEN_TYPE_ENUM.REMOTE,
    OPEN_TYPE_ENUM.TEMPORARY_PASSWORD,
    OPEN_TYPE_ENUM.KEY,
    OPEN_TYPE_ENUM.NFC,
    OPEN_TYPE_ENUM.PERMANENT_PASSWORD,
    OPEN_TYPE_ENUM.FACE,
    OPEN_TYPE_ENUM.EYE,
    OPEN_TYPE_ENUM.FINGERPRINT,
  ]),
});

export const tempPasswordOpenNOtificationDataScheam = deviceOpenNotificationDataSchema.extend({
  type: z.literal(OPEN_TYPE_ENUM.TEMPORARY_PASSWORD),
  tempPassword: z.string(),
});

export const deviceBatteryNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.DEVICE_LOW_BATTERY, {
    message: `消息类型不符合要求(${NOTIFICATION_ENUM.DEVICE_LOW_BATTERY})`,
  }),
  device_battery: z.number(),
});

export const deviceFirmwareUpdateNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.FIRMWARE_UPDATE, {
    message: `消息类型不符合要求(${NOTIFICATION_ENUM.FIRMWARE_UPDATE})`,
  }),
  device_firmware_version: z.string(),
});

export const deviceOpenAlertNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.DOOR_OPEN_ALERT, {
    message: `消息类型不符合要求(${NOTIFICATION_ENUM.DOOR_OPEN_ALERT})`,
  }),
  noOpenTime: z.number(),
});

export const deviceBrokenNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.DEVICE_BROKEN, {
    message: `消息类型不符合要求(${NOTIFICATION_ENUM.DEVICE_BROKEN})`,
  }),
  door_broken: z.string(),
});

export type notificationDataSchema =
  | z.infer<typeof deviceOpenNotificationDataSchema>
  | z.infer<typeof tempPasswordOpenNOtificationDataScheam>
  | z.infer<typeof deviceBatteryNotificationDataSchema>
  | z.infer<typeof deviceFirmwareUpdateNotificationDataSchema>
  | z.infer<typeof deviceOpenAlertNotificationDataSchema>
  | z.infer<typeof deviceBrokenNotificationDataSchema>;

export interface IAppNotificationMessage {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotiFIcationListItem {
  data: NotificaitonItem;
  deliveryStatus: string;
  device: Device;
  deviceId: string;
  id: string;
  importanceLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  notificationMethod: 'app' | 'sms' | 'call';
  timestamp: string;
  type:
    | 'doorbell' // 门铃
    | 'device_open_alert' // 长时间没有关门
    | 'device_low_battery' // 电量低
    | 'device_broken' // 门被破坏
    | 'device_open' // 开门
    | 'device_close' // 关门
    | 'device_offline' // 设备离线
    | 'device_online' // 设备上线
    | 'firmware_update'; // 固件更新
  userId: string;
}

export type NotificaitonItem = z.infer<typeof NotificaitonItemSchema> & {
  unlockData?: z.infer<typeof deviceUnlockRecordDataSchema>;
};
