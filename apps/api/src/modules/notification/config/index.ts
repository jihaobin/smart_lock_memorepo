/**
 * 通知系统配置
 */
import { IMPORTANCE_LEVEL, NOTIFICATION_ENUM } from '@smart-lock/shared';

/**
 * 通知渠道类型
 * 目前数据库和系统中支持的所有通知渠道类型
 * 注意: 虽然从业务逻辑上critical是一种特殊类型，但在数据库中需要使用预定义的类型
 */
export const NOTIFICATION_CHANNELS = {
  APP: 'app', // 应用内通知
  SMS: 'sms', // 短信通知
  CALL: 'call', // 电话通知
} as const;

/**
 * 通知级别配置
 * 将不同类型的通知映射到对应的重要性级别
 */
export const notificationLevel: Record<string, string> = {
  // 关键紧急通知
  [NOTIFICATION_ENUM.DEVICE_BROKEN]: IMPORTANCE_LEVEL.CRITICAL,

  // 高重要性通知
  [NOTIFICATION_ENUM.DOOR_OPEN_ALERT]: IMPORTANCE_LEVEL.HIGH, // 长时间没有关门

  // 中等重要性通知
  [NOTIFICATION_ENUM.DOORBELL]: IMPORTANCE_LEVEL.MEDIUM, // 门铃
  [NOTIFICATION_ENUM.DEVICE_LOW_BATTERY]: IMPORTANCE_LEVEL.MEDIUM,

  // 低重要性通知
  [NOTIFICATION_ENUM.DEVICE_OPEN]: IMPORTANCE_LEVEL.LOW,
  [NOTIFICATION_ENUM.DEVICE_CLOSE]: IMPORTANCE_LEVEL.LOW,
  [NOTIFICATION_ENUM.DEVICE_ONLINE]: IMPORTANCE_LEVEL.LOW,
  [NOTIFICATION_ENUM.DEVICE_OFFLINE]: IMPORTANCE_LEVEL.LOW,
  [NOTIFICATION_ENUM.FIRMWARE_UPDATE]: IMPORTANCE_LEVEL.LOW,

  // 其他通知 - 使用字符串键而非枚举
  temp_password_used: IMPORTANCE_LEVEL.MEDIUM,
};

/**
 * 重试配置
 * 基于重要性级别的不同重试策略
 */
export const retryConfig = {
  [IMPORTANCE_LEVEL.CRITICAL]: {
    maxRetries: 7,
    baseRetryInterval: 3000, // 3秒开始
    useCallEscalation: true,
  },
  [IMPORTANCE_LEVEL.HIGH]: {
    maxRetries: 5,
    baseRetryInterval: 5000, // 5秒开始
    useCallEscalation: true,
  },
  [IMPORTANCE_LEVEL.MEDIUM]: {
    maxRetries: 3,
    baseRetryInterval: 10000, // 10秒开始
    useCallEscalation: false,
  },
  [IMPORTANCE_LEVEL.LOW]: {
    maxRetries: 1,
    baseRetryInterval: 30000, // 30秒后重试一次
    useCallEscalation: false,
  },
};
