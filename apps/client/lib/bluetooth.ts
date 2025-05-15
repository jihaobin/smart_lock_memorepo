import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State, Subscription, ScanMode } from 'react-native-ble-plx';

import { BluetoothDevice, WifiNetwork, WiFiSecurity, AddDeviceError } from '../types/add-device';

// 蓝牙服务和特性UUID
const SERVICE_UUID = '00001234-0000-1000-8000-00805f9b34fb'; // 示例UUID，需要替换为实际的门锁服务UUID
const WIFI_LIST_CHARACTERISTIC = '00002345-0000-1000-8000-00805f9b34fb'; // 示例UUID，需要替换为实际的特性UUID
const WIFI_CONFIG_CHARACTERISTIC = '00003456-0000-1000-8000-00805f9b34fb'; // 示例UUID，需要替换为实际的特性UUID

// 超时设置
const SCAN_TIMEOUT = 10000; // 10秒
const CONNECTION_TIMEOUT = 15000; // 15秒

// 蓝牙管理器单例
let bleManager: BleManager | null = null;
let scanListener: Subscription | null = null;
let stateListener: Subscription | null = null;

// 缓存已发现的设备
let discoveredDevices: Map<string, BluetoothDevice> = new Map();

/**
 * 初始化蓝牙管理器
 */
export const initializeBluetooth = (): BleManager => {
  if (!bleManager) {
    bleManager = new BleManager();

    // 监听蓝牙状态变化
    stateListener = bleManager.onStateChange(state => {
      console.log('蓝牙状态改变:', state);
    }, true);
  }
  return bleManager;
};

/**
 * 清理蓝牙资源
 */
export const cleanupBluetooth = (): void => {
  if (scanListener) {
    scanListener.remove();
    scanListener = null;
  }

  if (stateListener) {
    stateListener.remove();
    stateListener = null;
  }

  if (bleManager) {
    bleManager.destroy();
    bleManager = null;
  }

  discoveredDevices.clear();
};

/**
 * 检查并请求蓝牙权限
 */
export const checkBluetoothPermissions = async (): Promise<boolean> => {
  // iOS不需要明确请求蓝牙权限
  if (Platform.OS === 'ios') {
    return true;
  }

  // Android 12+需要BLUETOOTH_SCAN和BLUETOOTH_CONNECT权限
  if (Platform.OS === 'android' && Platform.Version >= 31) {
    const results = await Promise.all([
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT),
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
    ]);

    return results.every(result => result === 'granted');
  }

  // Android 6.0-11需要ACCESS_FINE_LOCATION权限
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return granted === 'granted';
};

/**
 * 检查蓝牙是否开启
 */
export const isBluetoothEnabled = async (): Promise<boolean> => {
  const manager = initializeBluetooth();
  const state = await manager.state();

  return state === State.PoweredOn;
};

/**
 * 扫描蓝牙设备
 * @param onDeviceFound 发现设备时的回调
 * @param onError 发生错误时的回调
 * @param timeoutMs 扫描超时时间
 */
export const startScan = async (
  onDeviceFound: (device: BluetoothDevice) => void,
  onError: (error: AddDeviceError) => void,
  timeoutMs: number = SCAN_TIMEOUT
): Promise<void> => {
  try {
    // 检查权限
    const hasPermission = await checkBluetoothPermissions();
    if (!hasPermission) {
      onError({
        code: 'permission_denied',
        message: '需要蓝牙和位置权限以扫描设备',
      });
      return;
    }

    // 检查蓝牙是否开启
    const enabled = await isBluetoothEnabled();
    if (!enabled) {
      onError({
        code: 'bluetooth_disabled',
        message: '请开启蓝牙以扫描设备',
      });
      return;
    }

    const manager = initializeBluetooth();

    // 清理之前的扫描
    if (scanListener) {
      scanListener.remove();
    }

    // 清除之前的设备
    discoveredDevices.clear();

    // 开始扫描
    scanListener = manager.onStateChange(async state => {
      if (state === State.PoweredOn) {
        try {
          await manager.startDeviceScan(
            null, // 不限制服务UUID
            {
              allowDuplicates: false,
              scanMode: ScanMode.LowLatency,
            },
            (error, device) => {
              if (error) {
                onError({
                  code: 'scan_error',
                  message: `扫描错误: ${error.message}`,
                  context: { nativeError: error },
                });
                return;
              }

              if (device && device.name) {
                // 转换为应用内部设备类型
                const bluetoothDevice: BluetoothDevice = {
                  id: device.id,
                  name: device.name,
                  rssi: device.rssi || 0,
                  isConnectable: true,
                  isConnected: false,
                  manufacturerData: device.manufacturerData || undefined,
                  serviceUUIDs: device.serviceUUIDs || undefined,
                  localName: device.localName || undefined,
                };

                // 存储设备并通知
                discoveredDevices.set(device.id, bluetoothDevice);
                onDeviceFound(bluetoothDevice);
              }
            }
          );

          // 设置超时
          setTimeout(() => stopScan(), timeoutMs);
        } catch (error) {
          onError({
            code: 'scan_start_error',
            message: '启动扫描失败',
            context: { error },
          });
        }
      }
    }, true);
  } catch (error) {
    onError({
      code: 'unknown_error',
      message: '扫描过程中发生未知错误',
      context: { error },
    });
  }
};

/**
 * 停止扫描
 */
export const stopScan = (): void => {
  const manager = initializeBluetooth();
  manager.stopDeviceScan();

  if (scanListener) {
    scanListener.remove();
    scanListener = null;
  }
};

/**
 * 获取已发现的设备列表
 */
export const getDiscoveredDevices = (): BluetoothDevice[] => {
  return Array.from(discoveredDevices.values());
};

/**
 * 连接到设备
 * @param deviceId 设备ID
 * @param onConnected 连接成功的回调
 * @param onError 连接失败的回调
 * @param timeoutMs 连接超时时间
 */
export const connectToDevice = async (
  deviceId: string,
  onConnected: (device: Device) => void,
  onError: (error: AddDeviceError) => void,
  timeoutMs: number = CONNECTION_TIMEOUT
): Promise<void> => {
  const manager = initializeBluetooth();

  try {
    // 设置连接超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('连接超时')), timeoutMs);
    });

    // 尝试连接
    const connectionPromise = manager.connectToDevice(deviceId);
    const device = await Promise.race([connectionPromise, timeoutPromise]);

    // 发现服务
    const deviceWithServices = await device.discoverAllServicesAndCharacteristics();

    // 更新设备状态
    if (discoveredDevices.has(deviceId)) {
      const updatedDevice = discoveredDevices.get(deviceId)!;
      updatedDevice.isConnected = true;
      discoveredDevices.set(deviceId, updatedDevice);
    }

    onConnected(deviceWithServices);
  } catch (error) {
    onError({
      code: 'connection_error',
      message: error instanceof Error ? error.message : '连接设备失败',
      context: { error },
      retry: () => connectToDevice(deviceId, onConnected, onError, timeoutMs),
    });
  }
};

/**
 * 断开设备连接
 * @param deviceId 设备ID
 */
export const disconnectDevice = async (deviceId: string): Promise<void> => {
  const manager = initializeBluetooth();

  try {
    await manager.cancelDeviceConnection(deviceId);

    // 更新设备状态
    if (discoveredDevices.has(deviceId)) {
      const device = discoveredDevices.get(deviceId)!;
      device.isConnected = false;
      discoveredDevices.set(deviceId, device);
    }
  } catch (error) {
    console.error('断开连接失败:', error);
  }
};

/**
 * WiFi网络数据接口，用于设备返回的原始数据
 */
interface WifiData {
  ssid: string;
  bssid: string;
  rssi: number;
  security: string;
  frequency?: number;
  channel?: number;
}

/**
 * 获取WiFi网络列表
 * @param device 已连接的设备
 * @param onNetworksFound 发现网络的回调
 * @param onError 错误回调
 */
export const getWifiNetworks = async (
  device: Device,
  onNetworksFound: (networks: WifiNetwork[]) => void,
  onError: (error: AddDeviceError) => void
): Promise<void> => {
  try {
    // 读取WiFi列表特性
    const characteristic = await device.readCharacteristicForService(
      SERVICE_UUID,
      WIFI_LIST_CHARACTERISTIC
    );

    if (characteristic.value) {
      // 解码Base64值
      const value = Buffer.from(characteristic.value, 'base64').toString('utf8');

      try {
        // 假设设备返回JSON格式的WiFi列表
        const wifiData = JSON.parse(value) as WifiData[];

        // 转换为应用内部WiFi网络类型
        const networks: WifiNetwork[] = wifiData.map(wifi => ({
          ssid: wifi.ssid,
          bssid: wifi.bssid,
          rssi: wifi.rssi,
          security: mapSecurityType(wifi.security),
          frequency: wifi.frequency,
          channel: wifi.channel,
          requiresPassword: wifi.security !== 'OPEN',
        }));

        // 按信号强度排序
        networks.sort((a, b) => b.rssi - a.rssi);

        onNetworksFound(networks);
      } catch (parseError) {
        onError({
          code: 'parse_error',
          message: '解析WiFi列表失败',
          context: { error: parseError },
        });
      }
    } else {
      onError({
        code: 'empty_response',
        message: '设备返回空的WiFi列表',
      });
    }
  } catch (error) {
    onError({
      code: 'wifi_scan_error',
      message: '获取WiFi列表失败',
      context: { error },
      retry: () => getWifiNetworks(device, onNetworksFound, onError),
    });
  }
};

/**
 * 配置设备WiFi连接
 * @param device 已连接的设备
 * @param config WiFi配置
 * @param onSuccess 配置成功回调
 * @param onError 错误回调
 */
export const configureDeviceWifi = async (
  device: Device,
  config: {
    ssid: string;
    password: string;
    deviceName: string;
    autoConnect: boolean;
    saveNetwork: boolean;
  },
  onSuccess: () => void,
  onError: (error: AddDeviceError) => void
): Promise<void> => {
  try {
    // 准备配置数据
    const configData = JSON.stringify(config);
    const base64Data = Buffer.from(configData).toString('base64');

    // 写入配置
    await device.writeCharacteristicWithResponseForService(
      SERVICE_UUID,
      WIFI_CONFIG_CHARACTERISTIC,
      base64Data
    );

    // 读取配置结果
    const resultCharacteristic = await device.readCharacteristicForService(
      SERVICE_UUID,
      WIFI_CONFIG_CHARACTERISTIC
    );

    if (resultCharacteristic.value) {
      const resultValue = Buffer.from(resultCharacteristic.value, 'base64').toString('utf8');

      try {
        const result = JSON.parse(resultValue);

        if (result.success) {
          onSuccess();
        } else {
          onError({
            code: 'config_rejected',
            message: result.message || '设备拒绝WiFi配置',
            context: { result },
          });
        }
      } catch (parseError) {
        onError({
          code: 'parse_error',
          message: '解析配置结果失败',
          context: { error: parseError },
        });
      }
    } else {
      onError({
        code: 'empty_response',
        message: '设备返回空的配置结果',
      });
    }
  } catch (error) {
    onError({
      code: 'wifi_config_error',
      message: '配置WiFi失败',
      context: { error },
      retry: () => configureDeviceWifi(device, config, onSuccess, onError),
    });
  }
};

/**
 * 将设备返回的安全类型映射到应用内部类型
 */
const mapSecurityType = (securityType: string): WiFiSecurity => {
  switch (securityType.toUpperCase()) {
    case 'WPA':
      return WiFiSecurity.WPA;
    case 'WPA2':
      return WiFiSecurity.WPA2;
    case 'WPA3':
      return WiFiSecurity.WPA3;
    case 'WEP':
      return WiFiSecurity.WEP;
    case 'OPEN':
      return WiFiSecurity.OPEN;
    default:
      return WiFiSecurity.UNKNOWN;
  }
};
