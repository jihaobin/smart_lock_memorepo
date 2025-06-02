import {
  NOTIFICATION_ENUM,
  OPEN_TYPE_ENUM,
  IMPORTANCE_LEVEL,
  NotificaitonItem,
} from '@smart-lock/shared';

/**
 * 根据通知类型和数据生成通知消息
 * 此函数与客户端的generateNotificationDescription功能类似，但针对服务端环境优化
 */
export function generateNotificationMessage(
  type: string,
  data: NotificaitonItem = {},
): string {
  // 开门通知
  if (type === NOTIFICATION_ENUM.DEVICE_OPEN) {
    if (data.openType === OPEN_TYPE_ENUM.TEMPORARY_PASSWORD) {
      return `临时密码 #${data.unlockData?.password || ''} 已被使用`;
    }

    if (data.openType === OPEN_TYPE_ENUM.FINGERPRINT) {
      return '使用指纹开锁进入';
    }

    if (data.openType === OPEN_TYPE_ENUM.PERMANENT_PASSWORD) {
      return '使用密码开锁进入';
    }

    if (data.openType === OPEN_TYPE_ENUM.FACE) {
      return '使用人脸识别开锁进入';
    }

    if (data.openType === OPEN_TYPE_ENUM.REMOTE) {
      return '使用远程开锁进入';
    }

    return '开锁进入';
  }

  // 电量低通知
  if (type === NOTIFICATION_ENUM.DEVICE_LOW_BATTERY) {
    return `设备电量低于${data.device_battery || '20'}%，请及时更换电池`;
  }

  // 固件更新通知
  if (type === NOTIFICATION_ENUM.FIRMWARE_UPDATE) {
    return `门锁固件已更新至${data.device_firmware_version || '最新'}版本`;
  }

  // 长时间开门通知
  if (type === NOTIFICATION_ENUM.DOOR_OPEN_ALERT) {
    return `门已开启${data.noOpenTime || '较长'}时间，请注意关门`;
  }

  // 设备离线通知
  if (type === NOTIFICATION_ENUM.DEVICE_OFFLINE) {
    return '设备已离线，请检查网络连接';
  }

  // 设备上线通知
  if (type === NOTIFICATION_ENUM.DEVICE_ONLINE) {
    return '设备已上线，可以正常使用';
  }

  // 设备关门通知
  if (type === NOTIFICATION_ENUM.DEVICE_CLOSE) {
    return '门已关闭';
  }

  // 设备损坏通知
  if (type === NOTIFICATION_ENUM.DEVICE_BROKEN) {
    return '检测到门锁异常，请及时检查';
  }

  // 门铃通知
  if (type === NOTIFICATION_ENUM.DOORBELL) {
    return '有人按门铃';
  }

  // 默认消息
  return '智能门锁通知';
}

/**
 * 根据通知类型确定通知重要性级别
 * @param type 通知类型
 * @returns 重要性级别
 */
export function determineImportanceLevel(
  type: string,
): (typeof IMPORTANCE_LEVEL)[keyof typeof IMPORTANCE_LEVEL] {
  switch (type) {
    // 关键紧急通知
    case NOTIFICATION_ENUM.DEVICE_BROKEN:
      return IMPORTANCE_LEVEL.CRITICAL;

    // 高重要性通知
    case NOTIFICATION_ENUM.DOOR_OPEN_ALERT:
      return IMPORTANCE_LEVEL.HIGH;

    // 中等重要性通知
    case NOTIFICATION_ENUM.DOORBELL:
    case NOTIFICATION_ENUM.DEVICE_LOW_BATTERY:
      return IMPORTANCE_LEVEL.MEDIUM;

    // 低重要性通知
    case NOTIFICATION_ENUM.DEVICE_ONLINE:
    case NOTIFICATION_ENUM.DEVICE_OFFLINE:
    case NOTIFICATION_ENUM.DEVICE_OPEN:
    case NOTIFICATION_ENUM.FIRMWARE_UPDATE:
    case NOTIFICATION_ENUM.DEVICE_CLOSE:
      return IMPORTANCE_LEVEL.LOW;

    // 默认为中等重要性
    default:
      return IMPORTANCE_LEVEL.MEDIUM;
  }
}

/**
 * 根据重要性级别确定通知方法
 * @param importanceLevel 重要性级别
 * @returns 通知方法
 */
export function determineNotificationMethod(
  importanceLevel: string,
): 'app' | 'sms' | 'call' {
  switch (importanceLevel) {
    case IMPORTANCE_LEVEL.CRITICAL:
    case IMPORTANCE_LEVEL.HIGH:
      return 'call';
    case IMPORTANCE_LEVEL.MEDIUM:
      return 'sms';
    case IMPORTANCE_LEVEL.LOW:
    default:
      return 'app';
  }
}
