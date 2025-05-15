/**
 * 设备添加流程相关类型定义
 */

// 连接状态枚举
export enum ConnectionStatus {
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// WiFi安全类型枚举
export enum WiFiSecurity {
  WPA = 'wpa',
  WPA2 = 'wpa2',
  WPA3 = 'wpa3',
  WEP = 'wep',
  OPEN = 'open',
  UNKNOWN = 'unknown',
}

// 添加设备步骤枚举
export enum AddDeviceStep {
  SCAN_BLUETOOTH = 'scan_bluetooth',
  CONNECT_DEVICE = 'connect_device',
  SCAN_WIFI = 'scan_wifi',
  CONFIGURE_WIFI = 'configure_wifi',
  COMPLETE = 'complete',
}

// 蓝牙设备接口
export interface BluetoothDevice {
  id: string;
  name: string | null;
  rssi: number;
  isConnectable: boolean;
  isConnected: boolean;
  manufacturerData?: string;
  serviceUUIDs?: string[];
  localName?: string;
}

// WiFi网络接口
export interface WifiNetwork {
  ssid: string;
  bssid: string;
  rssi: number;
  security: WiFiSecurity;
  frequency?: number;
  channel?: number;
  requiresPassword: boolean;
}

// 设备配置接口
export interface DeviceConfig {
  ssid: string;
  password: string;
  deviceName: string;
  autoConnect: boolean;
  saveNetwork: boolean;
  groupId?: string;
}

// 错误信息接口
export interface AddDeviceError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  retry?: () => void;
}

// 设备添加上下文接口
export interface AddDeviceContext {
  currentStep: AddDeviceStep;
  selectedDevice: BluetoothDevice | null;
  scannedWifiNetworks: WifiNetwork[];
  selectedWifi: WifiNetwork | null;
  deviceConfig: Partial<DeviceConfig>;
  error: AddDeviceError | null;
  scannedDevices?: BluetoothDevice[];
}
