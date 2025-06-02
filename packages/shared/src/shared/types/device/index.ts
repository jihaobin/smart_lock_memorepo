export interface Device {
  deviceGroupId: string;
  hasCamera: boolean;
  id: string;
  name: string;
  ownerId: string;
  status: DeviceStatus;
  type: string;
  nikeName: string;
}

export interface DeviceStatus {
  // 设备电量
  batteryLevel: number;
  // 设备固件版本
  firmwareVersion: number;
  // 是否在线
  isOnline: boolean;
  // 门是否开启
  isOpen: boolean;
  // 最后一次连接时间
  lastConnectionTime: string;
  // 连接ID
  connectionId: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
}
