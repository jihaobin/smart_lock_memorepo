'use client';

import { CheckCircle2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text } from 'react-native';

import { BluetoothScanner } from './bluetooth-scanner';
import { DeviceConnection } from './device-connection';
import { WifiSetup } from './wifi-setup';

import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useAddDevice } from '@/contexts/add-device-context';
import { AddDeviceStep } from '@/types/add-device';

interface AddDeviceStepperProps {
  initialStep?: AddDeviceStep;
  onComplete?: () => void;
  className?: string;
}

export function AddDeviceStepper({
  initialStep = AddDeviceStep.SCAN_BLUETOOTH,
  onComplete,
  className = '',
}: AddDeviceStepperProps) {
  const { state, setCurrentStep } = useAddDevice();
  const [activeStep, setActiveStep] = useState<AddDeviceStep>(initialStep);

  // 步骤总数
  const totalSteps = Object.keys(AddDeviceStep).length;

  // 获取当前步骤索引
  const getCurrentStepIndex = () => {
    const steps = Object.values(AddDeviceStep);
    return steps.indexOf(state.currentStep);
  };

  // 获取当前步骤进度百分比
  const getProgressPercentage = () => {
    const currentIndex = getCurrentStepIndex();
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  };

  // 步骤完成回调
  const handleStepComplete = (nextStep: AddDeviceStep) => {
    setCurrentStep(nextStep);
  };

  // 步骤返回回调
  const handleStepBack = (prevStep: AddDeviceStep) => {
    setCurrentStep(prevStep);
  };

  // 渲染当前步骤组件
  const renderStepComponent = () => {
    switch (state.currentStep) {
      case AddDeviceStep.SCAN_BLUETOOTH:
        return (
          <BluetoothScanner onComplete={() => handleStepComplete(AddDeviceStep.CONNECT_DEVICE)} />
        );

      case AddDeviceStep.CONNECT_DEVICE:
        return (
          <DeviceConnection
            onComplete={() => handleStepComplete(AddDeviceStep.SCAN_WIFI)}
            onBack={() => handleStepBack(AddDeviceStep.SCAN_BLUETOOTH)}
          />
        );

      case AddDeviceStep.SCAN_WIFI:
      case AddDeviceStep.CONFIGURE_WIFI:
        return (
          <WifiSetup
            onComplete={() => handleStepComplete(AddDeviceStep.COMPLETE)}
            onBack={() => handleStepBack(AddDeviceStep.CONNECT_DEVICE)}
          />
        );

      case AddDeviceStep.COMPLETE:
        return (
          <View className="flex-1 justify-center items-center px-6">
            <View className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-8">
              <Icon as={CheckCircle2} className="text-green-500 h-12 w-12" />
            </View>
            <Text className="text-2xl font-bold text-center mb-3 text-gray-800">设置成功！</Text>
            <Text className="text-gray-500 text-center mb-10 text-base">
              您的智能门锁已成功配置并连接到网络。现在您可以随时控制和监控您的门锁。
            </Text>
            {onComplete && (
              <Button className="px-10 py-3 rounded-xl" onPress={onComplete}>
                <ButtonText className="text-base font-medium">完成</ButtonText>
              </Button>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  // 获取步骤标题
  const getStepTitle = (step: AddDeviceStep) => {
    switch (step) {
      case AddDeviceStep.SCAN_BLUETOOTH:
        return '搜索设备';
      case AddDeviceStep.CONNECT_DEVICE:
        return '连接设备';
      case AddDeviceStep.SCAN_WIFI:
        return '配置网络';
      case AddDeviceStep.CONFIGURE_WIFI:
        return '网络设置';
      case AddDeviceStep.COMPLETE:
        return '完成设置';
      default:
        return '';
    }
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => {
    const currentStepIndex = getCurrentStepIndex();
    const steps = Object.values(AddDeviceStep);

    return (
      <View className="flex-row justify-between items-center mb-8 px-2">
        {steps.map((step, index) => {
          // 确定步骤状态
          const isActive = index === currentStepIndex;
          const isPast = index < currentStepIndex;
          const isFuture = index > currentStepIndex;

          // 步骤样式
          const stepStyle = isActive
            ? 'bg-primary border-primary'
            : isPast
              ? 'bg-primary border-primary'
              : 'bg-white border-gray-300';

          // 步骤文字样式
          const textStyle = isActive
            ? 'text-primary font-medium'
            : isPast
              ? 'text-primary'
              : 'text-gray-400';

          // 连接线样式
          const lineStyle = isPast ? 'bg-primary' : 'bg-gray-300';

          return (
            <React.Fragment key={step}>
              {/* 步骤圆点和标题 */}
              <View className="flex items-center">
                <View
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${stepStyle}`}
                >
                  {isPast ? (
                    <Text className="text-white text-xs">✓</Text>
                  ) : (
                    <Text
                      className={`${isActive ? 'text-white' : 'text-gray-400'} text-sm font-medium`}
                    >
                      {index + 1}
                    </Text>
                  )}
                </View>
                {/* 步骤标题仅显示当前和已完成的步骤 */}
                {(isActive || isPast) && (
                  <Text className={`text-xs mt-2 text-center ${textStyle}`}>
                    {getStepTitle(step)}
                  </Text>
                )}
              </View>

              {/* 连接线 (除了最后一个步骤) */}
              {index < steps.length - 1 && <View className={`flex-1 h-1 ${lineStyle} mx-1`} />}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <View className={`flex-1 ${className}`}>
      {/* 进度条 */}
      <View className="h-1.5 bg-gray-100 mb-8 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </View>

      {/* 步骤指示器 */}
      {renderStepIndicator()}

      {/* 步骤内容 */}
      {renderStepComponent()}
    </View>
  );
}
