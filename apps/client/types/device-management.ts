import type {
  Device as BackendDevice,
  DeviceGroup as BackendDeviceGroup,
} from '@smart-lock/shared';

// 重新导出共享库中的类型，使其作为前端的标准类型
export type { BackendDevice as Device, BackendDeviceGroup as DeviceGroup };

// 前端特有的类型定义
export interface Tab {
  key: string;
  title: string;
}

// 前端设备视图模型，用于UI显示
export interface DeviceViewModel {
  id: string;
  name: string; // 已处理的显示名称（优先使用nikeName）
  status: 'locked' | 'unlocked';
  batteryLevel: number;
  isOnline: boolean;
  groupId: string | null;
  deviceType: string;
  hasCamera: boolean;
}

// 包含UI状态的设备类型
export interface DeviceWithUIState extends DeviceViewModel {
  isSelected?: boolean;
  isExpanded?: boolean;
}

// 带有设备的设备组
export interface DeviceGroupWithDevices extends BackendDeviceGroup {
  devices: DeviceViewModel[];
}
