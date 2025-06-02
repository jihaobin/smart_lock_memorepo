'use client';

import {
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Progress } from '@/components/ui/progress';
import { useAddDevice } from '@/contexts/add-device-context';
import { AddDeviceStep } from '@/types/add-device';

// 连接状态类型
enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

interface DeviceConnectionProps {
  onComplete?: () => void;
  onBack?: () => void;
  className?: string;
}

export function DeviceConnection({ onComplete, onBack, className = '' }: DeviceConnectionProps) {
  const { state, connectToSelectedDevice, disconnectSelectedDevice, setCurrentStep, clearError } =
    useAddDevice();

  const [connectionState, setConnectionState] = useState<ConnectionState>(
    ConnectionState.CONNECTING
  );
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionTimeout, setConnectionTimeout] = useState<NodeJS.Timeout | null>(null);

  // 处理返回操作
  const handleBack = () => {
    disconnectSelectedDevice();
    setCurrentStep(AddDeviceStep.SCAN_BLUETOOTH);
    if (onBack) {
      onBack();
    }
  };

  // 处理继续操作
  const handleContinue = () => {
    if (connectionState === ConnectionState.CONNECTED) {
      setCurrentStep(AddDeviceStep.SCAN_WIFI);
      if (onComplete) {
        onComplete();
      }
    }
  };

  // 重试连接
  const handleRetry = async () => {
    clearError();
    setConnectionState(ConnectionState.CONNECTING);
    setConnectionProgress(0);
    await startConnection();
  };

  // 开始连接过程
  const startConnection = async () => {
    // 清除之前的超时
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    // 模拟连接进度
    const progressInterval = setInterval(() => {
      setConnectionProgress(prev => {
        const newProgress = prev + 10;
        return newProgress < 95 ? newProgress : prev;
      });
    }, 500);

    // 设置20秒超时
    const timeout = setTimeout(() => {
      clearInterval(progressInterval);

      // 如果仍在连接状态，则视为超时
      if (connectionState === ConnectionState.CONNECTING) {
        setConnectionState(ConnectionState.TIMEOUT);
      }
    }, 20000);

    setConnectionTimeout(timeout);

    try {
      // 开始连接
      await connectToSelectedDevice();

      // 连接成功
      clearInterval(progressInterval);
      clearTimeout(timeout);
      setConnectionProgress(100);
      setConnectionState(ConnectionState.CONNECTED);
    } catch {
      // 连接失败
      clearInterval(progressInterval);
      clearTimeout(timeout);
      setConnectionState(ConnectionState.FAILED);
    }
  };

  // 组件挂载时开始连接
  useEffect(() => {
    startConnection();

    // 组件卸载时清理
    return () => {
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, []);

  // 监听连接状态
  useEffect(() => {
    if (state.selectedDevice?.isConnected) {
      setConnectionState(ConnectionState.CONNECTED);
      setConnectionProgress(100);
    } else if (state.error) {
      setConnectionState(ConnectionState.FAILED);
    }
  }, [state.selectedDevice?.isConnected, state.error]);

  // 渲染连接状态
  const renderConnectionStatus = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTING:
        return (
          <View className="items-center">
            <View className="mb-6 w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
              <Icon as={RefreshCw} className="h-12 w-12 text-blue-500 animate-spin" />
            </View>
            <Text className="text-xl font-medium mb-3 text-gray-800">正在连接设备</Text>
            <Text className="text-gray-500 text-center mb-6 px-8">
              正在与设备建立连接，请稍候...
            </Text>
            <Progress
              value={connectionProgress}
              className="w-full max-w-sm h-2.5 mb-3 bg-gray-100"
              indicatorClassName="bg-primary"
            />
            <Text className="text-sm text-gray-500">{connectionProgress}%</Text>
          </View>
        );

      case ConnectionState.CONNECTED:
        return (
          <View className="items-center">
            <View className="mb-6 w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
              <Icon as={CheckCircle2} className="h-12 w-12 text-green-500" />
            </View>
            <Text className="text-xl font-medium mb-3 text-gray-800">连接成功</Text>
            <Text className="text-gray-500 text-center mb-6 px-8">
              设备已成功连接，可以继续下一步操作。
            </Text>
            <View className="w-full max-w-sm bg-green-50 rounded-xl p-4 flex-row items-center">
              <Icon as={Check} className="h-6 w-6 text-green-500 mr-3" />
              <View>
                <Text className="text-green-700 font-medium mb-1">设备已连接</Text>
                <Text className="text-green-600 text-sm">
                  {state.selectedDevice?.name || '未命名设备'}
                </Text>
              </View>
            </View>
          </View>
        );

      case ConnectionState.FAILED:
        return (
          <View className="items-center">
            <View className="mb-6 w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
              <Icon as={XCircle} className="h-12 w-12 text-red-500" />
            </View>
            <Text className="text-xl font-medium mb-3 text-gray-800">连接失败</Text>
            <Text className="text-gray-500 text-center mb-6 px-8">
              {state.error?.message || '无法连接到设备，请检查设备是否开启并在范围内。'}
            </Text>
            <View className="w-full max-w-sm bg-red-50 rounded-xl p-4">
              <View className="flex-row items-start">
                <Icon as={AlertCircle} className="h-6 w-6 text-red-500 mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-red-700 font-medium mb-1">错误信息</Text>
                  <Text className="text-red-600 text-sm">{state.error?.message || '连接超时'}</Text>
                </View>
              </View>
              <View className="flex-row mt-4 justify-end space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleRetry}
                  className="border-primary"
                >
                  <Icon as={RefreshCw} className="h-4 w-4 text-primary mr-2" />
                  <ButtonText className="text-primary font-medium">重试</ButtonText>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleBack}
                  className="border-gray-300"
                >
                  <Icon as={ArrowLeft} className="h-4 w-4 text-gray-500 mr-2" />
                  <ButtonText className="text-gray-600 font-medium">返回</ButtonText>
                </Button>
              </View>
            </View>
          </View>
        );

      case ConnectionState.TIMEOUT:
        return (
          <View className="items-center">
            <View className="mb-6 w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center">
              <Icon as={AlertCircle} className="h-12 w-12 text-orange-500" />
            </View>
            <Text className="text-xl font-medium mb-3 text-gray-800">连接超时</Text>
            <Text className="text-gray-500 text-center mb-6 px-8">
              连接设备超时，请确保设备已开启并在范围内。
            </Text>
            <View className="w-full max-w-sm bg-orange-50 rounded-xl p-4">
              <View className="flex-row items-start">
                <Icon as={AlertCircle} className="h-6 w-6 text-orange-500 mr-3 mt-0.5" />
                <View className="flex-1">
                  <Text className="text-orange-700 font-medium mb-1">连接超时</Text>
                  <Text className="text-orange-600 text-sm">未能在规定时间内完成连接</Text>
                </View>
              </View>
              <View className="flex-row mt-4 justify-end space-x-3">
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleRetry}
                  className="border-primary"
                >
                  <Icon as={RefreshCw} className="h-4 w-4 text-primary mr-2" />
                  <ButtonText className="text-primary font-medium">重试</ButtonText>
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleBack}
                  className="border-gray-300"
                >
                  <Icon as={ArrowLeft} className="h-4 w-4 text-gray-500 mr-2" />
                  <ButtonText className="text-gray-600 font-medium">返回</ButtonText>
                </Button>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View className={`flex-1 ${className}`}>
      {/* 头部 */}
      <View className="mb-5">
        <Pressable onPress={handleBack} className="flex-row items-center self-start mb-4">
          <Icon as={ArrowLeft} className="h-5 w-5 text-gray-600 mr-2" />
          <Text className="text-gray-600 font-medium">返回</Text>
        </Pressable>

        <Text className="text-2xl font-semibold text-gray-800 mb-2">
          {connectionState === ConnectionState.CONNECTED ? '设备连接成功' : '正在连接设备'}
        </Text>
        <Text className="text-gray-500 mb-6">
          {connectionState === ConnectionState.CONNECTED
            ? '您已成功连接到设备，请继续下一步'
            : '正在尝试与所选设备建立连接'}
        </Text>
      </View>

      {/* 连接状态 */}
      <View className="flex-1 justify-center px-4">{renderConnectionStatus()}</View>

      {/* 底部操作区 */}
      {connectionState === ConnectionState.CONNECTED && (
        <View className="mt-8">
          <Button onPress={handleContinue} className="w-full py-3 rounded-xl">
            <ButtonText className="font-medium text-base">继续</ButtonText>
          </Button>
        </View>
      )}
    </View>
  );
}
