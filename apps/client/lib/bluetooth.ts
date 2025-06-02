import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, State, Subscription, ScanMode } from 'react-native-ble-plx';
import { btoa, atob } from 'react-native-quick-base64';
import WifiManager from 'react-native-wifi-reborn';

import { BluetoothDevice, WifiNetwork, WiFiSecurity, AddDeviceError } from '../types/add-device';

// 蓝牙服务和特性UUID
const SERVICE_UUID = '1775244d-6b43-439b-877c-060f2d9bed07'; // 示例UUID，需要替换为实际的门锁服务UUID
const WIFI_CONFIG_CHARACTERISTIC = 'prov-config'; // 示例UUID，需要替换为实际的特性UUID

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

    console.log('Discovered services and characteristics');

    // 获取所有服务
    const services = await device.services();

    // 遍历服务和特征
    for (const service of services) {
      console.log(`Service UUID: ${service.uuid}`);
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
 * 检查并请求WiFi扫描所需权限
 */
export const checkWifiPermissions = async (): Promise<boolean> => {
  // iOS不需要额外权限
  if (Platform.OS === 'ios') {
    return true;
  }

  // Android需要ACCESS_FINE_LOCATION权限
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'WiFi扫描需要位置权限',
      message: '应用需要位置权限来扫描WiFi网络',
      buttonNegative: '拒绝',
      buttonPositive: '允许',
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

/**
 * 使用手机扫描WiFi网络
 * @param onNetworksFound 发现网络的回调
 * @param onError 错误回调
 * @param timeoutMs 扫描超时时间
 */
export const scanPhoneWifiNetworks = async (
  onNetworksFound: (networks: WifiNetwork[]) => void,
  onError: (error: AddDeviceError) => void,
  timeoutMs: number = SCAN_TIMEOUT
): Promise<void> => {
  try {
    // 检查WiFi扫描权限
    const hasPermission = await checkWifiPermissions();
    if (!hasPermission) {
      onError({
        code: 'permission_denied',
        message: '需要位置权限以扫描WiFi网络',
      });
      return;
    }

    // 设置超时
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('WiFi扫描超时')), timeoutMs);
    });

    // 定义从react-native-wifi-reborn获取的WiFi条目类型
    interface WifiEntry {
      SSID: string;
      BSSID: string;
      level: number; // level在react-native-wifi-reborn中是数字类型
      capabilities: string;
      frequency?: number;
      timestamp?: number;
    }

    // 开始扫描WiFi
    try {
      const scanPromise = WifiManager.loadWifiList() as Promise<WifiEntry[]>;
      const wifiList = await Promise.race([scanPromise, timeoutPromise]);

      // 转换为应用内部WiFi网络类型
      const networks: WifiNetwork[] = wifiList.map(wifi => ({
        ssid: wifi.SSID,
        bssid: wifi.BSSID,
        rssi: wifi.level, // 直接使用level作为rssi，不需要parseInt
        security: mapWifiSecurityType(wifi.capabilities || ''),
        frequency: wifi.frequency,
        requiresPassword: !wifi.capabilities?.includes('OPEN') && wifi.capabilities !== '',
      }));

      // 按信号强度排序
      networks.sort((a, b) => b.rssi - a.rssi);

      onNetworksFound(networks);
    } catch (error) {
      if (error instanceof Error && error.message === 'WiFi扫描超时') {
        onError({
          code: 'timeout',
          message: 'WiFi扫描超时，请重试',
          retry: () => scanPhoneWifiNetworks(onNetworksFound, onError, timeoutMs),
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    onError({
      code: 'wifi_scan_error',
      message: '获取WiFi列表失败',
      context: { error },
      retry: () => scanPhoneWifiNetworks(onNetworksFound, onError, timeoutMs),
    });
  }
};

/**
 * 将WiFi能力字符串映射到安全类型
 */
const mapWifiSecurityType = (capabilities: string): WiFiSecurity => {
  const capsUpper = capabilities.toUpperCase();
  if (capsUpper.includes('WPA3')) {
    return WiFiSecurity.WPA3;
  } else if (capsUpper.includes('WPA2')) {
    return WiFiSecurity.WPA2;
  } else if (capsUpper.includes('WPA')) {
    return WiFiSecurity.WPA;
  } else if (capsUpper.includes('WEP')) {
    return WiFiSecurity.WEP;
  } else if (capsUpper.includes('OPEN') || capsUpper === '') {
    return WiFiSecurity.OPEN;
  } else {
    return WiFiSecurity.UNKNOWN;
  }
};

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
  // 不再从设备获取WiFi列表，而是使用手机扫描
  return scanPhoneWifiNetworks(onNetworksFound, onError);
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
  console.log('');

  try {
    // 准备配置数据
    const configData = JSON.stringify(config);
    const base64Data = btoa(configData);
    console.log('device', JSON.stringify(device));

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
      const resultValue = atob(resultCharacteristic.value);

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
