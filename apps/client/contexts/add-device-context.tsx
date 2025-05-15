'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Device } from 'react-native-ble-plx';

import {
  connectToDevice,
  configureDeviceWifi,
  disconnectDevice,
  getDiscoveredDevices,
  getWifiNetworks,
  initializeBluetooth,
  startScan,
  stopScan,
} from '@/lib/bluetooth';
import {
  AddDeviceContext as AddDeviceContextType,
  AddDeviceError,
  AddDeviceStep,
  BluetoothDevice,
  DeviceConfig,
  WifiNetwork,
} from '@/types/add-device';

// 初始状态
const initialState: AddDeviceContextType = {
  currentStep: AddDeviceStep.SCAN_BLUETOOTH,
  selectedDevice: null,
  scannedWifiNetworks: [],
  selectedWifi: null,
  deviceConfig: {},
  error: null,
  scannedDevices: [],
};

// 创建Context
const AddDeviceContext = createContext<{
  state: AddDeviceContextType;
  setCurrentStep: (step: AddDeviceStep) => void;
  startBluetoothScan: () => Promise<void>;
  stopBluetoothScan: () => void;
  selectDevice: (device: BluetoothDevice) => void;
  connectToSelectedDevice: () => Promise<void>;
  disconnectSelectedDevice: () => Promise<void>;
  scanWifiNetworks: () => Promise<void>;
  selectWifiNetwork: (network: WifiNetwork) => void;
  updateDeviceConfig: (config: Partial<DeviceConfig>) => void;
  configureDeviceWifiConnection: () => Promise<void>;
  resetAddDeviceState: () => void;
  handleError: (error: AddDeviceError) => void;
  clearError: () => void;
}>({
  state: initialState,
  setCurrentStep: () => {},
  startBluetoothScan: async () => {},
  stopBluetoothScan: () => {},
  selectDevice: () => {},
  connectToSelectedDevice: async () => {},
  disconnectSelectedDevice: async () => {},
  scanWifiNetworks: async () => {},
  selectWifiNetwork: () => {},
  updateDeviceConfig: () => {},
  configureDeviceWifiConnection: async () => {},
  resetAddDeviceState: () => {},
  handleError: () => {},
  clearError: () => {},
});

// Provider组件
export const AddDeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AddDeviceContextType>(initialState);

  // 用于连接设备后的实例引用
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

  // 初始化蓝牙
  useEffect(() => {
    initializeBluetooth();
    return () => {
      // 组件卸载时断开设备连接
      if (state.selectedDevice?.id && state.selectedDevice.isConnected) {
        disconnectDevice(state.selectedDevice.id).catch(console.error);
      }
    };
  }, [state.selectedDevice?.id, state.selectedDevice?.isConnected]);

  // 设置当前步骤
  const setCurrentStep = useCallback((step: AddDeviceStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  // 开始蓝牙扫描
  const startBluetoothScan = useCallback(async () => {
    setState(prev => ({ ...prev, error: null }));

    await startScan(
      device => {
        setState(prev => {
          const existingDevices = prev.scannedDevices || [];
          const deviceExists = existingDevices.some((d: BluetoothDevice) => d.id === device.id);

          if (!deviceExists) {
            return {
              ...prev,
              // 保留扫描到的设备列表，用于显示
              scannedDevices: [...existingDevices, device],
            };
          }

          return prev;
        });
      },
      error => {
        setState(prev => ({ ...prev, error }));
      }
    );

    // 扫描完成后更新设备列表
    const devices = getDiscoveredDevices();
    setState(prev => ({ ...prev, scannedDevices: devices }));
  }, []);

  // 停止蓝牙扫描
  const stopBluetoothScan = useCallback(() => {
    stopScan();
  }, []);

  // 选择设备
  const selectDevice = useCallback((device: BluetoothDevice) => {
    setState(prev => ({ ...prev, selectedDevice: device }));
  }, []);

  // 连接到选中的设备
  const connectToSelectedDevice = useCallback(async () => {
    if (!state.selectedDevice) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'no_device_selected',
          message: '请先选择一个设备',
        },
      }));
      return;
    }

    setState(prev => ({ ...prev, error: null }));

    await connectToDevice(
      state.selectedDevice.id,
      device => {
        setConnectedDevice(device);
        setState(prev => ({
          ...prev,
          selectedDevice: {
            ...prev.selectedDevice!,
            isConnected: true,
          },
          currentStep: AddDeviceStep.SCAN_WIFI,
        }));
      },
      error => {
        setState(prev => ({ ...prev, error }));
      }
    );
  }, [state.selectedDevice]);

  // 断开选中设备的连接
  const disconnectSelectedDevice = useCallback(async () => {
    if (!state.selectedDevice?.id) return;

    await disconnectDevice(state.selectedDevice.id);
    setConnectedDevice(null);

    setState(prev => ({
      ...prev,
      selectedDevice: prev.selectedDevice ? { ...prev.selectedDevice, isConnected: false } : null,
    }));
  }, [state.selectedDevice?.id]);

  // 扫描WiFi网络
  const scanWifiNetworks = useCallback(async () => {
    if (!connectedDevice) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'device_not_connected',
          message: '设备未连接，无法扫描WiFi',
        },
      }));
      return;
    }

    setState(prev => ({ ...prev, error: null, scannedWifiNetworks: [] }));

    await getWifiNetworks(
      connectedDevice,
      networks => {
        setState(prev => ({
          ...prev,
          scannedWifiNetworks: networks,
        }));
      },
      error => {
        setState(prev => ({ ...prev, error }));
      }
    );
  }, [connectedDevice]);

  // 选择WiFi网络
  const selectWifiNetwork = useCallback((network: WifiNetwork) => {
    setState(prev => ({
      ...prev,
      selectedWifi: network,
      deviceConfig: {
        ...prev.deviceConfig,
        ssid: network.ssid,
      },
    }));
  }, []);

  // 更新设备配置
  const updateDeviceConfig = useCallback((config: Partial<DeviceConfig>) => {
    setState(prev => ({
      ...prev,
      deviceConfig: {
        ...prev.deviceConfig,
        ...config,
      },
    }));
  }, []);

  // 配置设备WiFi连接
  const configureDeviceWifiConnection = useCallback(async () => {
    if (!connectedDevice) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'device_not_connected',
          message: '设备未连接，无法配置WiFi',
        },
      }));
      return;
    }

    const { deviceConfig } = state;

    if (!deviceConfig.ssid || !deviceConfig.password || !deviceConfig.deviceName) {
      setState(prev => ({
        ...prev,
        error: {
          code: 'incomplete_config',
          message: '请填写完整的WiFi配置信息',
        },
      }));
      return;
    }

    setState(prev => ({ ...prev, error: null }));

    await configureDeviceWifi(
      connectedDevice,
      {
        ssid: deviceConfig.ssid,
        password: deviceConfig.password || '',
        deviceName: deviceConfig.deviceName || '',
        autoConnect: deviceConfig.autoConnect || false,
        saveNetwork: deviceConfig.saveNetwork || false,
      },
      () => {
        setState(prev => ({
          ...prev,
          currentStep: AddDeviceStep.COMPLETE,
        }));
      },
      error => {
        setState(prev => ({ ...prev, error }));
      }
    );
  }, [connectedDevice, state.deviceConfig]);

  // 重置状态
  const resetAddDeviceState = useCallback(() => {
    // 断开连接
    if (state.selectedDevice?.id && state.selectedDevice.isConnected) {
      disconnectDevice(state.selectedDevice.id).catch(console.error);
    }

    setConnectedDevice(null);
    setState(initialState);
  }, [state.selectedDevice?.id, state.selectedDevice?.isConnected]);

  // 处理错误
  const handleError = useCallback((error: AddDeviceError) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 提供状态和方法
  const contextValue = {
    state,
    setCurrentStep,
    startBluetoothScan,
    stopBluetoothScan,
    selectDevice,
    connectToSelectedDevice,
    disconnectSelectedDevice,
    scanWifiNetworks,
    selectWifiNetwork,
    updateDeviceConfig,
    configureDeviceWifiConnection,
    resetAddDeviceState,
    handleError,
    clearError,
  };

  return <AddDeviceContext.Provider value={contextValue}>{children}</AddDeviceContext.Provider>;
};

// 自定义hook，方便组件使用
export const useAddDevice = () => {
  const context = useContext(AddDeviceContext);

  if (!context) {
    throw new Error('useAddDevice必须在AddDeviceProvider内部使用');
  }

  return context;
};
