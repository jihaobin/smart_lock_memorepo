'use client';

import { Bluetooth, RefreshCw, Signal, AlertCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useAddDevice } from '@/contexts/add-device-context';
import { AddDeviceStep, BluetoothDevice } from '@/types/add-device';

// 计算信号强度等级，返回1-4的值表示信号强度
const getSignalStrength = (rssi: number): number => {
  // RSSI通常为负值，越接近0信号越强
  const absRssi = Math.abs(rssi);

  if (absRssi < 50) return 4; // 强信号
  if (absRssi < 60) return 3; // 良好信号
  if (absRssi < 70) return 2; // 中等信号
  return 1; // 弱信号
};

// 信号强度图标组件
const SignalStrengthIcon = ({ strength }: { strength: number }) => {
  // 信号强度对应的颜色
  const colors = {
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-green-500',
    4: 'text-green-600',
  };

  return (
    <View className="flex items-center">
      <Icon as={Signal} className={`h-5 w-5 ${colors[strength as keyof typeof colors]}`} />
      <Text className="text-xs text-gray-500 mt-1">{strength}/4</Text>
    </View>
  );
};

// 设备卡片组件
interface DeviceCardProps {
  device: BluetoothDevice;
  isSelected: boolean;
  onSelect: (device: BluetoothDevice) => void;
}

const DeviceCard = ({ device, isSelected, onSelect }: DeviceCardProps) => {
  const signalStrength = getSignalStrength(device.rssi);

  return (
    <Pressable
      className={`p-4 mb-3 rounded-lg border ${
        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'
      } shadow-sm`}
      onPress={() => onSelect(device)}
    >
      <View className="flex flex-row items-center justify-between">
        <View className="flex flex-row items-center">
          <View
            className={`
            w-12 h-12 rounded-full
            ${isSelected ? 'bg-primary/20' : 'bg-blue-50'}
            flex items-center justify-center mr-4
          `}
          >
            <Icon
              as={Bluetooth}
              className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-blue-500'}`}
            />
          </View>
          <View>
            <Text className="font-medium text-base">{device.name || '未命名设备'}</Text>
            <Text className="text-xs text-gray-500 mt-1">ID: {device.id.substring(0, 8)}...</Text>
          </View>
        </View>

        <View className="flex flex-row items-center space-x-4">
          <SignalStrengthIcon strength={signalStrength} />
          {device.isConnected && (
            <View className="bg-green-100 px-2 py-1 rounded-full">
              <Text className="text-xs text-green-700 font-medium">已连接</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

// 蓝牙扫描组件
interface BluetoothScannerProps {
  onComplete?: () => void;
  className?: string;
}

export function BluetoothScanner({ onComplete, className = '' }: BluetoothScannerProps) {
  const { state, startBluetoothScan, stopBluetoothScan, selectDevice, setCurrentStep, clearError } =
    useAddDevice();

  const [isScanning, setIsScanning] = useState(false);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  // 开始扫描
  const handleStartScan = async () => {
    setIsScanning(true);
    clearError();

    // 设置10秒后自动停止扫描
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }

    const timeout = setTimeout(() => {
      setIsScanning(false);
    }, 10000);

    setScanTimeout(timeout);

    try {
      await startBluetoothScan();
    } catch {
      setIsScanning(false);
    }
  };

  // 选择设备
  const handleSelectDevice = (device: BluetoothDevice) => {
    selectDevice(device);
  };

  // 继续到下一步
  const handleContinue = () => {
    if (state.selectedDevice) {
      setCurrentStep(AddDeviceStep.CONNECT_DEVICE);
      if (onComplete) {
        onComplete();
      }
    }
  };

  // 组件挂载时自动开始扫描
  useEffect(() => {
    handleStartScan();

    // 组件卸载时清理
    return () => {
      stopBluetoothScan();
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, []);

  return (
    <View className={`flex-1 ${className}`}>
      <View className="mb-6">
        <Text className="text-2xl font-semibold mb-2 text-gray-800">扫描附近设备</Text>
        <Text className="text-gray-500 mb-5 text-base">请确保您的智能门锁处于配对模式</Text>

        {/* 扫描状态 */}
        <View className="mb-6">
          {isScanning ? (
            <View className="flex flex-row items-center justify-center py-3 px-4 bg-blue-50 rounded-lg">
              <Icon as={RefreshCw} className="h-5 w-5 text-blue-500 animate-spin mr-3" />
              <Text className="text-blue-700 font-medium">正在扫描附近的设备...</Text>
            </View>
          ) : (
            <View className="flex flex-row justify-between items-center">
              <Text className="text-gray-600 font-medium">
                {state.scannedDevices?.length
                  ? `发现${state.scannedDevices.length}个设备`
                  : '未发现设备'}
              </Text>
              <Pressable
                onPress={handleStartScan}
                className="flex flex-row items-center bg-primary/10 px-3 py-2 rounded-full"
              >
                <Icon as={RefreshCw} className="h-4 w-4 text-primary mr-1" />
                <Text className="text-primary font-medium">刷新</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* 错误信息 */}
        {state.error && (
          <View className="mb-5 p-4 bg-red-50 rounded-lg flex flex-row items-start">
            <Icon as={AlertCircle} className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <View className="flex-1">
              <Text className="text-red-700 font-medium mb-1">扫描出错</Text>
              <Text className="text-red-600 text-sm">{state.error.message}</Text>
              {state.error.retry && (
                <Pressable
                  className="mt-3 self-end bg-red-100 px-3 py-2 rounded-full"
                  onPress={() => state.error?.retry?.()}
                >
                  <Text className="text-red-700 font-medium">重试</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
      </View>

      {/* 设备列表 */}
      <ScrollView className="flex-1 mb-5" showsVerticalScrollIndicator={false}>
        {(!state.scannedDevices || state.scannedDevices.length === 0) && !isScanning && (
          <View className="py-10 px-5 flex items-center justify-center bg-gray-50 rounded-xl">
            <Icon as={Bluetooth} className="h-12 w-12 text-gray-300 mb-3" />
            <Text className="text-gray-600 text-center font-medium">未发现设备</Text>
            <Text className="text-gray-400 text-center text-sm mt-2 mb-4 px-6">
              确保设备已开启并处于配对模式
            </Text>
            <Button variant="outline" className="mt-2 border-primary" onPress={handleStartScan}>
              <Icon as={RefreshCw} className="h-4 w-4 text-primary mr-2" />
              <ButtonText className="text-primary font-medium">重新扫描</ButtonText>
            </Button>
          </View>
        )}

        {state.scannedDevices &&
          state.scannedDevices.map(device => (
            <DeviceCard
              key={device.id}
              device={device}
              isSelected={state.selectedDevice?.id === device.id}
              onSelect={handleSelectDevice}
            />
          ))}
      </ScrollView>

      {/* 底部操作区 */}
      <View className="mt-auto">
        <Button
          onPress={handleContinue}
          disabled={!state.selectedDevice}
          className={`w-full py-3 ${!state.selectedDevice ? 'opacity-50' : ''} rounded-xl`}
        >
          <ButtonText className="font-medium text-base">
            {state.selectedDevice ? '连接选中设备' : '请选择一个设备'}
          </ButtonText>
        </Button>
      </View>
    </View>
  );
}
