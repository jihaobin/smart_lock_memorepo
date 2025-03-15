'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Info } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { z } from 'zod';

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

// 定义PIN码验证schema
const pinSchema = z.object({
  pin: z
    .string()
    .min(4, 'PIN码至少需要4位')
    .max(8, 'PIN码最多8位')
    .refine(val => val === '1234', {
      message: 'PIN码不正确，请重试',
    }),
});

// 定义表单数据类型
type PinFormData = z.infer<typeof pinSchema>;

// 模拟设备数据
const deviceData = {
  id: '1',
  name: '前门智能锁',
  model: 'SmartLock Pro X1',
  installDate: '2023-05-15',
  lastReset: '从未重置',
};

export default function FactoryResetPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false);
  const [resetState, setResetState] = useState<'idle' | 'in-progress' | 'success' | 'error'>(
    'idle'
  );
  const [progress, setProgress] = useState(0);

  // 设置react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset: resetForm,
  } = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: undefined,
    },
  });

  // 模拟加载设备数据
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // 模拟重置过程
  const startReset = () => {
    setResetState('in-progress');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // 模拟有小概率失败的情况
          const success = Math.random() > 0.1;
          setResetState(success ? 'success' : 'error');
          return 100;
        }
        return prev + 5;
      });
    }, 500);

    return () => clearInterval(interval);
  };

  // 处理 PIN 码确认
  const handlePinConfirmation = () => {
    // PIN码验证已经由zod完成，如果能到这里，说明PIN码正确
    setShowFinalConfirmDialog(true);
    setShowConfirmDialog(false);
  };

  // 关闭确认对话框
  const closeConfirmDialog = () => {
    setShowConfirmDialog(false);
    resetForm();
  };

  // 返回设备管理页面
  const goBack = () => {
    router.push('/device-management');
  };

  // 重试重置过程
  const retryReset = () => {
    setResetState('idle');
    setProgress(0);
  };

  if (isLoading) {
    return (
      <Box className="p-4">
        <VStack space="md" className="items-center justify-center min-h-[300px]">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500">正在加载设备信息...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <ScrollView>
      <Box className="p-4">
        {resetState === 'idle' && (
          <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Box className="p-4">
              <HStack space="md" className="justify-between items-start">
                <VStack space="xs">
                  <Text className="text-lg font-bold">{deviceData.name}</Text>
                  <Text className="text-sm text-gray-500">型号: {deviceData.model}</Text>
                  <Text className="text-sm text-gray-500">ID: {id}</Text>
                </VStack>
                <Badge variant="outline">
                  <Text className="text-amber-600">敏感操作</Text>
                </Badge>
              </HStack>
            </Box>

            <VStack space="md" className="p-4">
              <HStack space="md" className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle size={24} color="#D97706" />
                <VStack space="xs" className="flex-1">
                  <Text className="font-semibold text-amber-800">重要警告</Text>
                  <Text className="text-sm text-amber-700 flex-shrink flex-wrap">
                    工厂重置将删除所有用户数据、设置和访问权限。此操作无法撤销。
                  </Text>
                </VStack>
              </HStack>

              <VStack space="sm">
                <Text className="font-semibold">重置将清除：</Text>
                <VStack space="sm">
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">所有用户访问权限和密码</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">所有自定义设置和偏好</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">所有访问日志和历史记录</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">所有紧急联系人信息</Text>
                  </HStack>
                </VStack>
              </VStack>

              <VStack space="sm">
                <Text className="font-semibold">设备信息</Text>
                <VStack space="xs">
                  <HStack space="md" className="justify-between">
                    <Text className="text-sm text-gray-500">设备 ID</Text>
                    <Text className="text-sm">{deviceData.id}</Text>
                  </HStack>
                  <HStack space="md" className="justify-between">
                    <Text className="text-sm text-gray-500">安装日期</Text>
                    <Text className="text-sm">{deviceData.installDate}</Text>
                  </HStack>
                  <HStack space="md" className="justify-between">
                    <Text className="text-sm text-gray-500">上次重置</Text>
                    <Text className="text-sm">{deviceData.lastReset}</Text>
                  </HStack>
                </VStack>
              </VStack>

              <HStack space="md" className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Info size={24} color="#3B82F6" />
                <VStack space="xs" className="flex-1">
                  <Text className="font-semibold text-blue-800">重置后需要重新设置</Text>
                  <Text className="text-sm text-blue-700 flex-shrink flex-wrap">
                    重置后，您需要重新配置设备并添加用户访问权限。请确保您有管理员凭据。
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            <Box className="p-4">
              <Button
                action="negative"
                variant="solid"
                size="md"
                onPress={() => setShowConfirmDialog(true)}
                className="w-full"
              >
                <ButtonText>开始恢复出厂设置</ButtonText>
              </Button>
            </Box>
          </Box>
        )}

        {resetState === 'in-progress' && (
          <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Box className="p-4">
              <Text className="text-lg font-bold">正在重置设备</Text>
              <Text className="text-sm text-gray-500">请勿断开设备电源或关闭应用</Text>
            </Box>

            <VStack space="lg" className="p-4">
              <VStack space="sm">
                <HStack space="md" className="justify-between">
                  <Text className="text-sm">重置进度</Text>
                  <Text className="text-sm">{progress}%</Text>
                </HStack>
                <Progress value={progress} size="sm">
                  <ProgressFilledTrack />
                </Progress>
              </VStack>

              <VStack space="sm">
                <Text className="font-semibold">重置步骤：</Text>
                <VStack space="sm">
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color={progress >= 20 ? '#10B981' : '#A1A1AA'} />
                    <Text
                      className={progress >= 20 ? 'text-sm text-black' : 'text-sm text-gray-500'}
                    >
                      清除用户数据
                    </Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color={progress >= 40 ? '#10B981' : '#A1A1AA'} />
                    <Text
                      className={progress >= 40 ? 'text-sm text-black' : 'text-sm text-gray-500'}
                    >
                      重置系统设置
                    </Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color={progress >= 60 ? '#10B981' : '#A1A1AA'} />
                    <Text
                      className={progress >= 60 ? 'text-sm text-black' : 'text-sm text-gray-500'}
                    >
                      清除访问日志
                    </Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color={progress >= 80 ? '#10B981' : '#A1A1AA'} />
                    <Text
                      className={progress >= 80 ? 'text-sm text-black' : 'text-sm text-gray-500'}
                    >
                      恢复出厂设置
                    </Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color={progress >= 100 ? '#10B981' : '#A1A1AA'} />
                    <Text
                      className={progress >= 100 ? 'text-sm text-black' : 'text-sm text-gray-500'}
                    >
                      完成重置
                    </Text>
                  </HStack>
                </VStack>
              </VStack>

              <Box className="items-center justify-center">
                <RefreshCw
                  size={32}
                  color="#3B82F6"
                  style={{ transform: [{ rotate: `${progress * 3.6}deg` }] }}
                />
              </Box>

              <Text className="text-center text-sm text-gray-500">
                重置过程可能需要几分钟时间。请保持设备通电并保持连接。
              </Text>
            </VStack>
          </Box>
        )}

        {resetState === 'success' && (
          <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <VStack space="sm" className="items-center p-4">
              <CheckCircle size={64} color="#10B981" />
              <Text className="text-xl font-bold mt-2">重置成功</Text>
              <Text className="text-sm text-gray-500">设备已成功恢复出厂设置</Text>
            </VStack>

            <VStack space="md" className="p-4">
              <Box className="p-4 bg-green-50 rounded-lg border border-green-200">
                <Text className="text-sm text-green-700 flex-shrink flex-wrap">
                  您的设备已成功重置为出厂设置。所有用户数据和设置已被清除。
                </Text>
              </Box>

              <VStack space="sm">
                <Text className="font-semibold text-sm">后续步骤：</Text>
                <VStack space="sm">
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-sm">重新配置设备基本设置</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-sm">添加新的用户访问权限</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-sm">设置新的安全偏好</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>

            <Box className="p-4">
              <Button
                action="primary"
                variant="solid"
                size="md"
                onPress={goBack}
                className="w-full"
              >
                <ButtonText>返回设备管理</ButtonText>
              </Button>
            </Box>
          </Box>
        )}

        {resetState === 'error' && (
          <Box className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <VStack space="sm" className="items-center p-4">
              <XCircle size={64} color="#EF4444" />
              <Text className="text-xl font-bold mt-2">重置失败</Text>
              <Text className="text-sm text-gray-500">设备重置过程中出现错误</Text>
            </VStack>

            <VStack space="md" className="p-4">
              <Box className="p-4 bg-red-50 rounded-lg border border-red-200">
                <Text className="text-sm text-red-700 flex-shrink flex-wrap">
                  很抱歉，重置过程中遇到了问题。您的设备可能处于部分重置状态。
                </Text>
              </Box>

              <VStack space="sm">
                <Text className="font-semibold text-sm">可能的原因：</Text>
                <VStack space="sm">
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">设备连接中断</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">设备电量不足</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <XCircle size={20} color="#EF4444" />
                    <Text className="text-sm">固件问题</Text>
                  </HStack>
                </VStack>
              </VStack>

              <VStack space="sm">
                <Text className="font-semibold text-sm">建议操作：</Text>
                <VStack space="sm">
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-sm">确保设备电量充足</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-sm">检查设备连接状态</Text>
                  </HStack>
                  <HStack space="sm" className="items-center">
                    <CheckCircle size={20} color="#10B981" />
                    <Text className="text-sm">稍后重试或联系客服</Text>
                  </HStack>
                </VStack>
              </VStack>
            </VStack>

            <VStack space="sm" className="p-4">
              <Button
                action="primary"
                variant="solid"
                size="md"
                onPress={retryReset}
                className="w-full mb-2"
              >
                <ButtonText>重试</ButtonText>
              </Button>
              <Button
                action="primary"
                variant="outline"
                size="md"
                onPress={goBack}
                className="w-full"
              >
                <ButtonText>返回设备管理</ButtonText>
              </Button>
            </VStack>
          </Box>
        )}

        {/* 第一次确认对话框 */}
        <AlertDialog isOpen={showConfirmDialog} onClose={closeConfirmDialog}>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <VStack space="xs">
                <Text className="text-lg font-bold">确认恢复出厂设置</Text>
                <Text className="text-sm text-gray-500 flex-shrink flex-wrap">
                  请输入设备管理员 PIN 码以确认重置操作。此操作将删除所有数据并无法撤销。
                </Text>
              </VStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack space="md" className="py-4">
                <VStack space="xs">
                  <Text className="text-sm font-semibold">管理员 PIN 码</Text>
                  <Controller
                    control={control}
                    name="pin"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        secureTextEntry
                        placeholder="输入 PIN 码"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        className={`border rounded-lg p-2.5 w-full ${
                          errors.pin ? 'border-red-500' : 'border-gray-200'
                        }`}
                      />
                    )}
                  />
                  {errors.pin && <Text className="text-sm text-red-500">{errors.pin.message}</Text>}
                </VStack>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <HStack space="sm" className="justify-end">
                <Button action="primary" variant="outline" size="sm" onPress={closeConfirmDialog}>
                  <ButtonText>取消</ButtonText>
                </Button>
                <Button
                  action="primary"
                  variant="solid"
                  size="sm"
                  onPress={handleSubmit(handlePinConfirmation)}
                >
                  <ButtonText>确认</ButtonText>
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 最终确认对话框 */}
        <AlertDialog
          isOpen={showFinalConfirmDialog}
          onClose={() => setShowFinalConfirmDialog(false)}
        >
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <VStack space="xs">
                <Text className="text-lg font-bold">最终确认</Text>
                <Text className="text-sm text-gray-500 flex-shrink flex-wrap">
                  您确定要将设备恢复出厂设置吗？此操作将立即开始，并且无法撤销。
                </Text>
              </VStack>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <HStack space="sm" className="justify-end">
                <Button
                  action="primary"
                  variant="outline"
                  size="sm"
                  onPress={() => setShowFinalConfirmDialog(false)}
                >
                  <ButtonText>取消</ButtonText>
                </Button>
                <Button
                  action="negative"
                  variant="solid"
                  size="sm"
                  onPress={() => {
                    setShowFinalConfirmDialog(false);
                    startReset();
                  }}
                >
                  <ButtonText>确认重置</ButtonText>
                </Button>
              </HStack>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Box>
    </ScrollView>
  );
}
