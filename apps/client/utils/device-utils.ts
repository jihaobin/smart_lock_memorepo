import type { Device } from '@smart-lock/shared';

import type { DeviceViewModel } from '@/types/device-management';

/**
 * 获取设备的显示名称
 * 优先使用nikeName，如果没有则使用name
 */
export function getDeviceDisplayName(device: Device | DeviceViewModel): string {
  // 对于前端设备视图模型，直接返回其name（已经是处理过的）
  if ('isOnline' in device && typeof device.isOnline === 'boolean') {
    return device.name;
  }
  // 对于后端设备模型，应用nikeName优先的逻辑
  return (device as Device).nikeName || device.name;
}

/**
 * 检查设备是否在线
 * 将status.isOnline转换为布尔值
 */
export function isDeviceOnline(device: Device | DeviceViewModel): boolean {
  // 对于前端设备视图模型，直接返回isOnline
  if ('isOnline' in device && typeof device.isOnline === 'boolean') {
    return device.isOnline;
  }
  // 对于后端设备模型，直接返回status.isOnline（已经是boolean）
  return (device as Device).status.isOnline;
}

/**
 * 获取设备电池电量
 */
export function getDeviceBatteryLevel(device: Device | DeviceViewModel): number {
  // 对于前端设备视图模型，直接返回batteryLevel
  if ('batteryLevel' in device && typeof device.batteryLevel === 'number') {
    return device.batteryLevel;
  }
  // 对于后端设备模型，返回status.batteryLevel
  return (device as Device).status.batteryLevel;
}

/**
 * 获取设备锁定状态
 * 将status.isOpen转换为locked/unlocked状态
 */
export function getDeviceLockStatus(device: Device | DeviceViewModel): 'locked' | 'unlocked' {
  // 对于前端设备视图模型，直接返回status
  if ('status' in device && (device.status === 'locked' || device.status === 'unlocked')) {
    return device.status;
  }
  // 对于后端设备模型，如果isOpen为false则锁定，为true则解锁
  return (device as Device).status.isOpen ? 'unlocked' : 'locked';
}

/**
 * 获取格式化后的电池电量显示（带%符号）
 */
export function getFormattedBatteryLevel(device: Device | DeviceViewModel): string {
  return `${getDeviceBatteryLevel(device)}%`;
}

/**
 * 获取设备在线状态的文本表示
 */
export function getOnlineStatusText(device: Device | DeviceViewModel): string {
  return isDeviceOnline(device) ? '在线' : '离线';
}

/**
 * 从设备实例创建一个前端友好的简化设备对象
 * 将嵌套属性提取到顶层
 */
export function createFrontendDevice(device: Device): DeviceViewModel {
  return {
    id: device.id,
    name: getDeviceDisplayName(device),
    status: getDeviceLockStatus(device),
    batteryLevel: getDeviceBatteryLevel(device),
    isOnline: isDeviceOnline(device),
    groupId: device.deviceGroupId || null,
    deviceType: device.type,
    hasCamera: device.hasCamera,
  };
}
