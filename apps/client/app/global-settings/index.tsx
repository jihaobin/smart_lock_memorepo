import { useRouter } from 'expo-router';
import { ChevronLeft, AlertTriangle, Lock, BatteryLow, DoorOpen, Bell } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';

// 骨架屏组件
const SettingItemSkeleton = () => (
  <Box className="px-4 py-4 bg-white border-b border-gray-100">
    <HStack className="justify-between items-center">
      <HStack className="items-center space-x-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <VStack space="xs">
          <SkeletonText className="w-32 h-4" />
          <SkeletonText className="w-48 h-3" />
        </VStack>
      </HStack>
      <Skeleton className="w-10 h-6 rounded-full" />
    </HStack>
  </Box>
);
// 设置项颜色配置
const COLORS = {
  notifications: '#3b82f6', // 蓝色
  autoLock: '#6b7280', // 灰色
  tamperAlert: '#ef4444', // 红色
  wrongPasswordAlert: '#f97316', // 橙色
  lowBatteryAlert: '#eab308', // 黄色
  doorOpenAlert: '#3b82f6', // 蓝色
  switchActive: '#ef4444', // 开关激活颜色（红色）
};

export default function GlobalSettings() {
  const [settings, setSettings] = useState({
    globalNotifications: true,
    globalAutoLock: true,
    globalTamperAlert: true,
    globalWrongPasswordAlert: true,
    globalLowBatteryAlert: true,
    globalDoorOpenAlert: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings({
        globalNotifications: true,
        globalAutoLock: true,
        globalTamperAlert: true,
        globalWrongPasswordAlert: true,
        globalLowBatteryAlert: true,
        globalDoorOpenAlert: true,
      });
      setIsLoading(false);
    };

    fetchSettings();
  }, []);

  const handleChange = (name: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast.toast({
      title: '全局设置已保存',
      description: '您的全局设置已成功更新。',
      variant: 'success',
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <Box className="flex-1 bg-gray-100">
        <Box className="px-4 py-4 bg-white">
          <HStack className="items-center">
            <Pressable className="mr-2 p-1" onPress={() => router.back()}>
              <Icon as={ChevronLeft} size="md" />
            </Pressable>
            <Heading size="md">
              <Text>全局设置</Text>
            </Heading>
          </HStack>
        </Box>

        <ScrollView className="flex-1">
          {/* 通知设置骨架屏 */}
          <Box className="mt-4 mx-4 rounded-lg overflow-hidden">
            <Box className="px-4 py-3 bg-white border-b border-gray-200">
              <Text className="font-bold">通知设置</Text>
            </Box>
            <SettingItemSkeleton />
          </Box>

          {/* 安全设置骨架屏 */}
          <Box className="mt-4 mx-4 mb-4 rounded-lg overflow-hidden">
            <Box className="px-4 py-3 bg-white border-b border-gray-200">
              <Text className="font-bold">安全设置</Text>
            </Box>
            <SettingItemSkeleton />
            <SettingItemSkeleton />
            <SettingItemSkeleton />
            <SettingItemSkeleton />
            <SettingItemSkeleton />
          </Box>

          <Box className="mt-2 mb-8 mx-4">
            <Skeleton className="w-full h-12 rounded-lg" />
          </Box>
        </ScrollView>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-gray-100">
      <ScrollView className="flex-1">
        {/* 通知设置 */}
        <Box className="mt-4 mx-4 rounded-lg overflow-hidden">
          <Box className="px-4 py-3 bg-white border-b border-gray-200">
            <Text className="font-bold">通知设置</Text>
          </Box>

          {/* 全局通知 */}
          <Box className="px-4 py-4 bg-white">
            <HStack className="justify-between items-center">
              <HStack className="items-center space-x-3">
                <Box
                  style={{ backgroundColor: `${COLORS.notifications}20` }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Icon as={Bell} size="sm" color={COLORS.notifications} />
                </Box>
                <VStack>
                  <Text className="font-medium">全局通知</Text>
                  <Text className="text-xs text-gray-500">为所有设备启用或禁用通知</Text>
                </VStack>
              </HStack>
              <Switch
                trackColor={{ false: '#d1d5db', true: COLORS.switchActive }}
                thumbColor={settings.globalNotifications ? '#ffffff' : '#f3f4f6'}
                value={settings.globalNotifications}
                onValueChange={(value: boolean) => handleChange('globalNotifications', value)}
              />
            </HStack>
          </Box>
        </Box>

        {/* 安全设置 */}
        <Box className="mt-4 mx-4 mb-4 rounded-lg overflow-hidden">
          <Box className="px-4 py-3 bg-white border-b border-gray-200">
            <Text className="font-bold">安全设置</Text>
          </Box>

          {/* 全局自动锁定 */}
          <Box className="px-4 py-4 bg-white border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="items-center space-x-3">
                <Box
                  style={{ backgroundColor: `${COLORS.autoLock}20` }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Icon as={Lock} size="sm" color={COLORS.autoLock} />
                </Box>
                <VStack>
                  <Text className="font-medium">全局自动锁定</Text>
                  <Text className="text-xs text-gray-500">为所有设备启用或禁用自动锁定</Text>
                </VStack>
              </HStack>
              <Switch
                trackColor={{ false: '#d1d5db', true: COLORS.switchActive }}
                thumbColor={settings.globalAutoLock ? '#ffffff' : '#f3f4f6'}
                value={settings.globalAutoLock}
                onValueChange={(value: boolean) => handleChange('globalAutoLock', value)}
              />
            </HStack>
          </Box>

          {/* 全局防拆警报 */}
          <Box className="px-4 py-4 bg-white border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="items-center space-x-3">
                <Box
                  style={{ backgroundColor: `${COLORS.tamperAlert}20` }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Icon as={AlertTriangle} size="sm" color={COLORS.tamperAlert} />
                </Box>
                <VStack>
                  <Text className="font-medium">全局防拆警报</Text>
                  <Text className="text-xs text-gray-500">为所有设备启用或禁用防拆警报</Text>
                </VStack>
              </HStack>
              <Switch
                trackColor={{ false: '#d1d5db', true: COLORS.switchActive }}
                thumbColor={settings.globalTamperAlert ? '#ffffff' : '#f3f4f6'}
                value={settings.globalTamperAlert}
                onValueChange={(value: boolean) => handleChange('globalTamperAlert', value)}
              />
            </HStack>
          </Box>

          {/* 全局密码错误警报 */}
          <Box className="px-4 py-4 bg-white border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="items-center space-x-3">
                <Box
                  style={{ backgroundColor: `${COLORS.wrongPasswordAlert}20` }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Icon as={Lock} size="sm" color={COLORS.wrongPasswordAlert} />
                </Box>
                <VStack>
                  <Text className="font-medium">全局密码错误警报</Text>
                  <Text className="text-xs text-gray-500">为所有设备启用或禁用密码错误警报</Text>
                </VStack>
              </HStack>
              <Switch
                trackColor={{ false: '#d1d5db', true: COLORS.switchActive }}
                thumbColor={settings.globalWrongPasswordAlert ? '#ffffff' : '#f3f4f6'}
                value={settings.globalWrongPasswordAlert}
                onValueChange={(value: boolean) => handleChange('globalWrongPasswordAlert', value)}
              />
            </HStack>
          </Box>

          {/* 全局电量低警报 */}
          <Box className="px-4 py-4 bg-white border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="items-center space-x-3">
                <Box
                  style={{ backgroundColor: `${COLORS.lowBatteryAlert}20` }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Icon as={BatteryLow} size="sm" color={COLORS.lowBatteryAlert} />
                </Box>
                <VStack>
                  <Text className="font-medium">全局电量低警报</Text>
                  <Text className="text-xs text-gray-500">为所有设备启用或禁用电量低警报</Text>
                </VStack>
              </HStack>
              <Switch
                trackColor={{ false: '#d1d5db', true: COLORS.switchActive }}
                thumbColor={settings.globalLowBatteryAlert ? '#ffffff' : '#f3f4f6'}
                value={settings.globalLowBatteryAlert}
                onValueChange={(value: boolean) => handleChange('globalLowBatteryAlert', value)}
              />
            </HStack>
          </Box>

          {/* 全局门开启通知 */}
          <Box className="px-4 py-4 bg-white">
            <HStack className="justify-between items-center">
              <HStack className="items-center space-x-3">
                <Box
                  style={{ backgroundColor: `${COLORS.doorOpenAlert}20` }}
                  className="w-8 h-8 rounded-full items-center justify-center"
                >
                  <Icon as={DoorOpen} size="sm" color={COLORS.doorOpenAlert} />
                </Box>
                <VStack>
                  <Text className="font-medium">全局门开启通知</Text>
                  <Text className="text-xs text-gray-500">为所有设备启用或禁用门开启通知</Text>
                </VStack>
              </HStack>
              <Switch
                trackColor={{ false: '#d1d5db', true: COLORS.switchActive }}
                thumbColor={settings.globalDoorOpenAlert ? '#ffffff' : '#f3f4f6'}
                value={settings.globalDoorOpenAlert}
                onValueChange={(value: boolean) => handleChange('globalDoorOpenAlert', value)}
              />
            </HStack>
          </Box>
        </Box>

        <Box className="mt-2 mb-8 mx-4">
          <Button onPress={handleSave} isDisabled={isSaving} className="w-full bg-primary">
            {isSaving ? (
              <HStack space="sm" className="items-center">
                <ActivityIndicator size="small" color="white" />
                <ButtonText>保存中...</ButtonText>
              </HStack>
            ) : (
              <ButtonText>保存全局设置</ButtonText>
            )}
          </Button>
        </Box>
      </ScrollView>
    </Box>
  );
}
