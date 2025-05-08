import React, { createContext, useContext, ReactNode } from 'react';

import { useDeviceGroups } from '@/hooks/useDeviceGroups';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceUIState } from '@/hooks/useDeviceUIState';
import type { Device, DeviceGroup, DeviceViewModel } from '@/types/device-management';

// 定义上下文类型
interface DeviceManagementContextType {
  // 设备数据和方法
  devices: DeviceViewModel[];
  filteredDevices: DeviceViewModel[];
  createDevice: (deviceId: string) => Promise<Device>;
  updateDevice: (id: string, deviceData: Partial<Device>) => Promise<Device>;
  deleteDevice: (id: string, deviceName: string) => Promise<void>;
  isLoadingDevices: boolean;
  isMutatingDevice: boolean;

  // 设备组数据和方法
  deviceGroups: DeviceGroup[];
  groupNameMap: Record<string, string>;
  createDeviceGroup: (groupData: { name: string }) => void;
  updateDeviceGroup: (groupData: DeviceGroup) => void;
  deleteDeviceGroup: (id: string, groupName: string) => void;
  isLoadingGroups: boolean;
  isMutatingGroup: boolean;

  // 设备操作方法
  operations: {
    updateDeviceStatus: (deviceId: string, status: 'locked' | 'unlocked') => Promise<Device>;
    updateDeviceName: (deviceId: string, name: string) => Promise<Device>;
    updateDeviceGroup: (deviceId: string, groupId: string) => Promise<Device>;
  };

  // UI状态
  ui: ReturnType<typeof useDeviceUIState>;

  // 刷新数据
  refetchDevices: () => Promise<void>;
  refetchDeviceGroups: () => Promise<void>;
}

// 创建上下文
const DeviceManagementContext = createContext<DeviceManagementContextType | undefined>(undefined);

// 上下文提供者组件
export function DeviceManagementProvider({ children }: { children: ReactNode }) {
  // 获取各模块数据和方法
  const devices = useDevices();
  const deviceGroups = useDeviceGroups();
  const ui = useDeviceUIState();

  // 根据UI筛选条件过滤设备
  const filteredDevices = devices.filterDevices(ui.searchText, ui.selectedGroup);

  // 刷新数据
  const refetchDevices = async () => {
    await devices.refetch();
  };

  const refetchDeviceGroups = async () => {
    await deviceGroups.refetch();
  };

  // 组合上下文值
  const contextValue: DeviceManagementContextType = {
    // 设备相关
    devices: devices.devices,
    filteredDevices,
    createDevice: devices.createDevice,
    updateDevice: devices.updateDevice,
    deleteDevice: devices.deleteDevice,
    isLoadingDevices: devices.status.isLoading,
    isMutatingDevice: devices.status.isMutating,

    // 设备组相关
    deviceGroups: deviceGroups.groups,
    groupNameMap: deviceGroups.groupNameMap,
    createDeviceGroup: deviceGroups.createGroup,
    updateDeviceGroup: deviceGroups.updateGroup,
    deleteDeviceGroup: deviceGroups.deleteGroup,
    isLoadingGroups: deviceGroups.status.isLoading,
    isMutatingGroup: deviceGroups.status.isMutating,

    // 设备操作方法
    operations: devices.operations,

    // UI状态
    ui,

    // 刷新数据
    refetchDevices,
    refetchDeviceGroups,
  };

  return (
    <DeviceManagementContext.Provider value={contextValue}>
      {children}
    </DeviceManagementContext.Provider>
  );
}

// 使用上下文的钩子
export function useDeviceManagement() {
  const context = useContext(DeviceManagementContext);
  if (context === undefined) {
    throw new Error('useDeviceManagement 必须在 DeviceManagementProvider 内部使用');
  }
  return context;
}
