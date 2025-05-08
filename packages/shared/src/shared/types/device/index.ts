export interface Device {
  deviceGroupId: string;
  hasCamera: boolean;
  id: string;
  name: string;
  ownerId: string;
  status: {
    // 设备电量
    batteryLevel: number;
    // 设备固件版本
    firmwareVersion: number;
    // 是否在线
    isOnline: boolean;
    // 门是否开启
    isOpen: boolean;
  };
  type: string;
  nikeName: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
}
