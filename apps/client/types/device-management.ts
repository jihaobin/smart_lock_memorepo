// 设备管理模块的类型定义
export interface Device {
  id: string;
  name: string;
  status: "locked" | "unlocked";
  batteryLevel: number;
  isOnline: boolean;
}

export interface DeviceGroup {
  id: string;
  name: string;
  devices: Device[];
}

// 额外类型定义
export interface Tab {
  key: string;
  title: string;
}

export interface DeviceManagementState {
  // 状态变量
  searchText: string;
  selectedGroup: string | null;
  deviceGroups: DeviceGroup[];
  
  // 模态框状态
  showAddDeviceDialog: boolean;
  showAddGroupDialog: boolean;
  showEditDeviceDialog: boolean;
  showEditGroupDialog: boolean;
  showDeleteDeviceDialog: boolean;
  showDeleteGroupDialog: boolean;
  
  // 新建和编辑状态
  newDevice: {
    name: string;
    groupId: string;
  };
  newGroup: {
    name: string;
  };
  editingDevice: {
    id: string;
    name: string;
    groupId: string;
  } | null;
  editingGroup: DeviceGroup | null;
  deviceToDelete: {
    id: string;
    name: string;
    groupId: string;
  } | null;
  groupToDelete: DeviceGroup | null;
}
