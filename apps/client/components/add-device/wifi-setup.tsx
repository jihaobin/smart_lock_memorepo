'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Wifi,
  RefreshCw,
  Check,
  AlertCircle,
  Lock,
  WifiOff,
  ArrowLeft,
  Signal,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { z } from 'zod';

import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAddDevice } from '@/contexts/add-device-context';
import { AddDeviceStep, WiFiSecurity, WifiNetwork } from '@/types/add-device';

// 表单验证Schema
const wifiConfigSchema = z.object({
  password: z.string().min(8, '密码长度至少为8个字符').max(63, '密码长度不能超过63个字符'),
  deviceName: z.string().min(1, '设备名称不能为空').max(32, '设备名称不能超过32个字符'),
  autoConnect: z.boolean().optional(),
  saveNetwork: z.boolean().optional(),
});

// 表单类型
type WifiConfigFormData = z.infer<typeof wifiConfigSchema>;

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

// 安全类型展示组件
const SecurityTypeTag = ({ security }: { security: WiFiSecurity }) => {
  const securityLabel = () => {
    switch (security) {
      case WiFiSecurity.WPA:
        return 'WPA';
      case WiFiSecurity.WPA2:
        return 'WPA2';
      case WiFiSecurity.WPA3:
        return 'WPA3';
      case WiFiSecurity.WEP:
        return 'WEP';
      case WiFiSecurity.OPEN:
        return '开放';
      default:
        return '未知';
    }
  };

  const securityColor =
    security === WiFiSecurity.OPEN ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';

  return (
    <View
      className={`px-2 py-0.5 rounded-full ${security === WiFiSecurity.OPEN ? 'bg-green-100' : 'bg-blue-100'}`}
    >
      <Text
        className={`text-xs font-medium ${security === WiFiSecurity.OPEN ? 'text-green-700' : 'text-blue-700'}`}
      >
        {securityLabel()}
      </Text>
    </View>
  );
};

// WiFi网络卡片组件
interface WifiNetworkCardProps {
  network: WifiNetwork;
  isSelected: boolean;
  onSelect: (network: WifiNetwork) => void;
}

const WifiNetworkCard = ({ network, isSelected, onSelect }: WifiNetworkCardProps) => {
  const signalStrength = getSignalStrength(network.rssi);

  return (
    <Pressable
      className={`p-4 mb-3 rounded-lg border ${
        isSelected ? 'border-primary bg-primary/10' : 'border-gray-200 bg-white'
      } shadow-sm`}
      onPress={() => onSelect(network)}
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
            {network.requiresPassword ? (
              <Icon
                as={Lock}
                className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-blue-500'}`}
              />
            ) : (
              <Icon
                as={Wifi}
                className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-blue-500'}`}
              />
            )}
          </View>
          <View>
            <Text className="font-medium text-base">{network.ssid}</Text>
            <View className="flex flex-row items-center mt-1">
              <SecurityTypeTag security={network.security} />
              {network.channel && (
                <Text className="text-xs text-gray-500 ml-2">频道: {network.channel}</Text>
              )}
            </View>
          </View>
        </View>

        <View className="flex flex-row items-center space-x-4">
          <SignalStrengthIcon strength={signalStrength} />
        </View>
      </View>
    </Pressable>
  );
};

// WiFi设置组件
interface WifiSetupProps {
  onComplete?: () => void;
  onBack?: () => void;
  className?: string;
}

export function WifiSetup({ onComplete, onBack, className = '' }: WifiSetupProps) {
  const {
    state,
    scanWifiNetworks,
    selectWifiNetwork,
    updateDeviceConfig,
    setCurrentStep,
    clearError,
    configureDeviceWifiConnection,
  } = useAddDevice();

  // 本地状态
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formStep, setFormStep] = useState<'scan' | 'password'>('scan');

  // 表单控制
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    register,
    setValue,
    watch,
  } = useForm<WifiConfigFormData>({
    resolver: zodResolver(wifiConfigSchema),
    defaultValues: {
      password: '',
      deviceName: state.selectedDevice?.name || '智能门锁',
      autoConnect: true,
      saveNetwork: true,
    },
    mode: 'onChange',
  });

  // 获取表单值
  const autoConnect = watch('autoConnect');
  const saveNetwork = watch('saveNetwork');

  // 开始扫描WiFi
  const handleStartScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    clearError();

    // 清除之前的定时器
    if (scanTimeout) {
      clearTimeout(scanTimeout);
    }

    // 模拟扫描进度
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        const newProgress = prev + 5;
        return newProgress < 90 ? newProgress : prev;
      });
    }, 300);

    // 设置10秒超时
    const timeout = setTimeout(() => {
      clearInterval(progressInterval);
      setIsScanning(false);

      if (scanProgress < 100) {
        setScanProgress(100);
      }
    }, 10000);

    setScanTimeout(timeout);

    try {
      // 开始扫描
      await scanWifiNetworks();

      // 正常完成
      clearInterval(progressInterval);
      clearTimeout(timeout);
      setScanProgress(100);
      setIsScanning(false);
    } catch {
      // 扫描出错
      clearInterval(progressInterval);
      clearTimeout(timeout);
      setIsScanning(false);
    }
  };

  // 选择WiFi网络
  const handleSelectWifi = (network: WifiNetwork) => {
    selectWifiNetwork(network);

    // 如果网络需要密码，进入密码输入步骤
    if (network.requiresPassword) {
      setFormStep('password');
    } else {
      // 不需要密码，直接继续配置
      updateDeviceConfig({
        password: '',
        deviceName: state.selectedDevice?.name || '智能门锁',
        autoConnect: true,
        saveNetwork: true,
      });

      // 继续到下一步
      if (onComplete) {
        onComplete();
      }
    }
  };

  // 返回到扫描页面
  const handleBackToScan = () => {
    setFormStep('scan');
  };

  // 处理返回操作
  const handleBack = () => {
    if (formStep === 'password') {
      handleBackToScan();
    } else {
      setCurrentStep(AddDeviceStep.CONNECT_DEVICE);
      if (onBack) {
        onBack();
      }
    }
  };

  // 提交WiFi配置
  const onSubmit = async (data: WifiConfigFormData) => {
    console.log('开始提交', data);
    updateDeviceConfig(data);
    await configureDeviceWifiConnection(data);
    console.log('配置完成');

    // 继续到下一步
    if (onComplete) {
      onComplete();
    }
  };

  // 组件挂载时自动开始扫描
  useEffect(() => {
    handleStartScan();

    // 组件卸载时清理
    return () => {
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
    };
  }, []);

  // 渲染WiFi扫描部分
  const renderWifiScan = () => (
    <View className="flex-1">
      <View className="mb-6">
        <Pressable onPress={handleBack} className="flex-row items-center self-start mb-4">
          <Icon as={ArrowLeft} className="h-5 w-5 text-gray-600 mr-2" />
          <Text className="text-gray-600 font-medium">返回</Text>
        </Pressable>

        <Text className="text-2xl font-semibold mb-2 text-gray-800">扫描WiFi网络</Text>
        <Text className="text-gray-500 mb-5 text-base">请选择您想要连接的WiFi网络</Text>

        {/* 扫描状态 */}
        <View className="mb-6">
          {isScanning ? (
            <View className="p-4">
              <View className="flex flex-row items-center justify-center mb-4">
                <Icon as={RefreshCw} className="h-5 w-5 text-blue-500 animate-spin mr-3" />
                <Text className="text-blue-700 font-medium">正在扫描WiFi网络...</Text>
              </View>
              <Progress
                value={scanProgress}
                className="w-full h-2.5 bg-gray-100"
                indicatorClassName="bg-primary"
              />
              <Text className="text-xs text-gray-500 mt-2 text-center">{scanProgress}%</Text>
            </View>
          ) : (
            <View className="flex flex-row justify-between items-center">
              <Text className="text-gray-600 font-medium">
                {state.scannedWifiNetworks?.length
                  ? `发现${state.scannedWifiNetworks.length}个网络`
                  : '未发现WiFi网络'}
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

      {/* WiFi列表 */}
      <ScrollView className="flex-1 mb-5" showsVerticalScrollIndicator={false}>
        {(!state.scannedWifiNetworks || state.scannedWifiNetworks.length === 0) && !isScanning && (
          <View className="py-10 px-5 flex items-center justify-center bg-gray-50 rounded-xl">
            <Icon as={WifiOff} className="h-12 w-12 text-gray-300 mb-3" />
            <Text className="text-gray-600 text-center font-medium">未发现WiFi网络</Text>
            <Text className="text-gray-400 text-center text-sm mt-2 mb-4 px-6">
              确保您的设备在WiFi信号覆盖范围内
            </Text>
            <Button variant="outline" className="mt-2 border-primary" onPress={handleStartScan}>
              <Icon as={RefreshCw} className="h-4 w-4 text-primary mr-2" />
              <ButtonText className="text-primary font-medium">重新扫描</ButtonText>
            </Button>
          </View>
        )}

        {state.scannedWifiNetworks &&
          state.scannedWifiNetworks.map(network => (
            <WifiNetworkCard
              key={`${network.ssid}-${network.bssid}`}
              network={network}
              isSelected={state.selectedWifi?.ssid === network.ssid}
              onSelect={handleSelectWifi}
            />
          ))}
      </ScrollView>
    </View>
  );

  // 渲染密码输入表单
  const renderPasswordForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="mb-5">
        <Pressable onPress={handleBackToScan} className="flex-row items-center self-start mb-4">
          <Icon as={ArrowLeft} className="h-5 w-5 text-gray-600 mr-2" />
          <Text className="text-gray-600 font-medium">返回</Text>
        </Pressable>

        <Text className="text-2xl font-semibold mb-2 text-gray-800">输入WiFi密码</Text>
        <Text className="text-gray-500 mb-4">为网络 "{state.selectedWifi?.ssid}" 输入密码</Text>

        {/* 网络信息 */}
        <View className="p-4 bg-blue-50 rounded-xl mb-6 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
            <Icon as={Wifi} className="h-6 w-6 text-blue-500" />
          </View>
          <View>
            <Text className="font-medium text-blue-800">{state.selectedWifi?.ssid}</Text>
            <View className="flex-row items-center mt-1">
              <SecurityTypeTag security={state.selectedWifi?.security || WiFiSecurity.UNKNOWN} />
              <SignalStrengthIcon strength={getSignalStrength(state.selectedWifi?.rssi || -70)} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="mb-6">
          <Text className="text-gray-700 mb-2 font-medium">WiFi密码</Text>
          <View className="relative mb-1">
            <TextInput
              className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base w-full pr-10"
              placeholder="输入WiFi密码"
              // secureTextEntry={!showPassword}
              value={watch('password')}
              onChangeText={value => setValue('password', value, { shouldValidate: true })}
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3"
            >
              {showPassword ? (
                <Icon as={EyeOff} className="h-5 w-5 text-gray-500" />
              ) : (
                <Icon as={Eye} className="h-5 w-5 text-gray-500" />
              )}
            </Pressable>
          </View>
          {errors.password && (
            <Text className="text-red-500 text-xs">{errors.password.message}</Text>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 mb-2 font-medium">设备名称</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-3 text-base w-full"
            placeholder="输入设备名称"
            value={watch('deviceName')}
            onChangeText={value => setValue('deviceName', value, { shouldValidate: true })}
          />
          {errors.deviceName && (
            <Text className="text-red-500 text-xs">{errors.deviceName.message}</Text>
          )}
        </View>

        <View className="mb-2">
          <Pressable
            onPress={() => setValue('autoConnect', !autoConnect)}
            className="flex-row items-center py-2"
          >
            <View
              className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${autoConnect ? 'bg-primary border-primary' : 'border-gray-300'}`}
            >
              {autoConnect && <Icon as={Check} className="h-4 w-4 text-white" />}
            </View>
            <Text className="text-gray-700">自动连接</Text>
          </Pressable>
        </View>

        <View className="mb-6">
          <Pressable
            onPress={() => setValue('saveNetwork', !saveNetwork)}
            className="flex-row items-center py-2"
          >
            <View
              className={`w-5 h-5 rounded border mr-3 flex items-center justify-center ${saveNetwork ? 'bg-primary border-primary' : 'border-gray-300'}`}
            >
              {saveNetwork && <Icon as={Check} className="h-4 w-4 text-white" />}
            </View>
            <Text className="text-gray-700">保存网络</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View className="mt-auto pt-4">
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid}
          className={`w-full py-3 rounded-xl ${!isValid ? 'opacity-50' : ''}`}
        >
          <ButtonText className="font-medium text-base">连接</ButtonText>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View className={`flex-1 ${className}`}>
      {formStep === 'scan' ? renderWifiScan() : renderPasswordForm()}
    </View>
  );
}
