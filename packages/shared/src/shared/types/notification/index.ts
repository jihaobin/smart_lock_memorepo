import { z } from 'zod';

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
  DIRECT: 'direct', // 直接
  NFC: 'nfc', // NFC
  PERMANENT_PASSWORD: 'permanent_password', // 永久密码
  FACE: 'face', // 人脸
  EYE: 'eye', // 瞳孔
  FINGERPRINT: 'fingerprint', // 指纹
} as const;

export type OPEN_TYPE_ENUM = typeof OPEN_TYPE_ENUM;

export const IMPORTANCE_LEVEL = {
  LOW: 'low', MEDIUM: 'medium', HIGH:'high', CRITICAL: 'critical' // // 低，中，高，紧急
} as const

export type IMPORTANCE_LEVEL = typeof IMPORTANCE_LEVEL

export const baseNotificationDataSchema = z.object({
  userId: z.string().min(1, { message: '用户ID不能为空' }),
  deviceId: z.string().min(1, { message: '设备ID不能为空' }),
  message: z.string().min(1, { message: '消息不能为空' }),
  type: z.enum([NOTIFICATION_ENUM.DOORBELL, // 门铃
    NOTIFICATION_ENUM.DOOR_OPEN_ALERT, // 长时间没有关门
    NOTIFICATION_ENUM.DEVICE_LOW_BATTERY, // 电量低
    NOTIFICATION_ENUM.DEVICE_BROKEN, // 门被破坏
    NOTIFICATION_ENUM.DEVICE_OPEN, // 开门
    NOTIFICATION_ENUM.DEVICE_CLOSE, // 关门
    NOTIFICATION_ENUM.DEVICE_OFFLINE, // 设备离线
    NOTIFICATION_ENUM.DEVICE_ONLINE, // 设备上线
    NOTIFICATION_ENUM.FIRMWARE_UPDATE, // 固件更新
  ], { message: '消息类型不符合要求' }),
});

export const deviceOpenNotificationDataSchema = baseNotificationDataSchema.extend({
  openType: z.enum([OPEN_TYPE_ENUM.REMOTE, OPEN_TYPE_ENUM.TEMPORARY_PASSWORD, OPEN_TYPE_ENUM.DIRECT, OPEN_TYPE_ENUM.NFC, OPEN_TYPE_ENUM.PERMANENT_PASSWORD, OPEN_TYPE_ENUM.FACE, OPEN_TYPE_ENUM.EYE, OPEN_TYPE_ENUM.FINGERPRINT]),
})

export const tempPasswordOpenNOtificationDataScheam = deviceOpenNotificationDataSchema.extend({
  type: z.literal(OPEN_TYPE_ENUM.TEMPORARY_PASSWORD),
  tempPassword: z.string()
})

export const deviceBatteryNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.DEVICE_LOW_BATTERY, { message: `消息类型不符合要求(${NOTIFICATION_ENUM.DEVICE_LOW_BATTERY})` }),
  device_battery: z.number(),
});

export const deviceFirmwareUpdateNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.FIRMWARE_UPDATE, { message:  `消息类型不符合要求(${NOTIFICATION_ENUM.FIRMWARE_UPDATE})` }),
  device_firmware_version: z.string(),
});

export const deviceOpenAlertNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.DOOR_OPEN_ALERT, { message: `消息类型不符合要求(${NOTIFICATION_ENUM.DOOR_OPEN_ALERT})` }),
  noOpenTime: z.number(),
});

export const deviceBrokenNotificationDataSchema = baseNotificationDataSchema.extend({
  type: z.literal(NOTIFICATION_ENUM.DEVICE_BROKEN, { message: `消息类型不符合要求(${NOTIFICATION_ENUM.DEVICE_BROKEN})` }),
  door_broken: z.string(),
});

export type notificationDataSchema = z.infer<typeof deviceOpenNotificationDataSchema> | z.infer<typeof tempPasswordOpenNOtificationDataScheam> | z.infer<typeof deviceBatteryNotificationDataSchema> | z.infer<typeof deviceFirmwareUpdateNotificationDataSchema> | z.infer<typeof deviceOpenAlertNotificationDataSchema> | z.infer<typeof deviceBrokenNotificationDataSchema>

export interface IAppNotificationMessage{
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}