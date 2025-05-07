import { NOTIFICATION_ENUM, OPEN_TYPE_ENUM, NotiFIcationListItem } from '@smart-lock/shared';

/**
 * 前端通知类型
 */
export type FrontendNotificationType = 'access' | 'alert' | 'system' | 'temporary';

/**
 * 将后端通知类型映射到前端显示类型
 * @param notification 后端通知对象
 * @returns 前端通知类型
 */
export function mapNotificationType(notification: NotiFIcationListItem): FrontendNotificationType {
  const { type, data } = notification;

  // 临时密码相关通知
  if (
    type === NOTIFICATION_ENUM.DEVICE_OPEN &&
    data.openType === OPEN_TYPE_ENUM.TEMPORARY_PASSWORD
  ) {
    return 'temporary';
  }

  // 开门相关通知映射为access类型
  if (type === NOTIFICATION_ENUM.DEVICE_OPEN) {
    return 'access';
  }

  // 警报类通知
  if (
    type === NOTIFICATION_ENUM.DEVICE_BROKEN ||
    type === NOTIFICATION_ENUM.DEVICE_LOW_BATTERY ||
    type === NOTIFICATION_ENUM.DOOR_OPEN_ALERT ||
    type === NOTIFICATION_ENUM.DEVICE_OFFLINE
  ) {
    return 'alert';
  }

  // 系统类通知
  if (
    type === NOTIFICATION_ENUM.FIRMWARE_UPDATE ||
    type === NOTIFICATION_ENUM.DEVICE_ONLINE ||
    type === NOTIFICATION_ENUM.DEVICE_CLOSE
  ) {
    return 'system';
  }

  // 默认为系统通知
  return 'system';
}

/**
 * 格式化通知时间
 * @param timestamp ISO格式的时间字符串
 * @returns 格式化后的时间字符串
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 如果是今天
  if (date >= today) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // 如果是昨天
  if (date >= yesterday) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  // 其他日期显示完整日期
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * 生成通知描述
 * @param notification 后端通知对象
 * @returns 格式化后的描述文本
 */
export function generateNotificationDescription(notification: NotiFIcationListItem): string {
  const { type, data } = notification;

  // 开门通知
  if (type === NOTIFICATION_ENUM.DEVICE_OPEN) {
    if (data.openType === OPEN_TYPE_ENUM.TEMPORARY_PASSWORD) {
      return `临时密码 #${data.temp_password} 已被使用`;
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
    return `设备电量低于${data.device_battery}%，请及时更换电池`;
  }

  // 固件更新通知
  if (type === NOTIFICATION_ENUM.FIRMWARE_UPDATE) {
    return `门锁固件已更新至${data.device_firmware_version}版本`;
  }

  // 长时间开门通知
  if (type === NOTIFICATION_ENUM.DOOR_OPEN_ALERT) {
    return `门已开启${data.noOpenTime}分钟，请注意关门`;
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

  // 默认返回原始消息
  return notification.message;
}

/**
 * 生成通知标题
 * @param notification 后端通知对象
 * @returns 格式化后的标题文本
 */
export function generateNotificationTitle(notification: NotiFIcationListItem): string {
  const { type, data } = notification;

  // 开门通知
  if (type === NOTIFICATION_ENUM.DEVICE_OPEN) {
    if (data.openType === OPEN_TYPE_ENUM.TEMPORARY_PASSWORD) {
      return '临时密码已使用';
    }

    if (data.openFriend) {
      return `${data.openFriend}已进入`;
    }

    return '有人已进入';
  }

  // 电量低通知
  if (type === NOTIFICATION_ENUM.DEVICE_LOW_BATTERY) {
    return '门锁电量低';
  }

  // 固件更新通知
  if (type === NOTIFICATION_ENUM.FIRMWARE_UPDATE) {
    return '系统更新';
  }

  // 长时间开门通知
  if (type === NOTIFICATION_ENUM.DOOR_OPEN_ALERT) {
    return '门长时间未关闭';
  }

  // 设备离线通知
  if (type === NOTIFICATION_ENUM.DEVICE_OFFLINE) {
    return '设备离线';
  }

  // 设备上线通知
  if (type === NOTIFICATION_ENUM.DEVICE_ONLINE) {
    return '设备已上线';
  }

  // 设备关门通知
  if (type === NOTIFICATION_ENUM.DEVICE_CLOSE) {
    return '门已关闭';
  }

  // 设备损坏通知
  if (type === NOTIFICATION_ENUM.DEVICE_BROKEN) {
    return '门锁异常警报';
  }

  // 默认返回原始消息
  return notification.message;
}
