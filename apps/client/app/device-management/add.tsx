import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { View, SafeAreaView } from 'react-native';

import { AddDeviceStepper } from '@/components/add-device/add-device-stepper';
import { AddDeviceProvider } from '@/contexts/add-device-context';

export default function AddDevicePage() {
  const router = useRouter();

  // 添加完成回调
  const handleAddComplete = () => {
    // 完成后返回设备列表页面
    router.replace('/(tabs)/device-management');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: '添加设备',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: 'white' },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      />

      <AddDeviceProvider>
        <View className="flex-1 px-4 pt-2 pb-4">
          <AddDeviceStepper onComplete={handleAddComplete} />
        </View>
      </AddDeviceProvider>
    </SafeAreaView>
  );
}
