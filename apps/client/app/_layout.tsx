import { QueryClientProvider } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { DevToolsBubble } from 'react-native-react-query-devtools';
import '../global.css';

import Header from '@/components/header';
import { ToastProvider } from '@/components/toast-provider';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ApiProvider } from '@/contexts/ApiContext';
import { AuthProvider } from '@/contexts/AuthContext';
import queryClient from '@/lib/queryClient';

// 配置通知处理方式
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const onCopy = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      return true;
    } catch {
      return false;
    }
  };

  // 请求通知权限
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // 如果未确定权限，请求权限
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        // 如果权限被拒绝，处理提示用户开启权限的逻辑
        if (finalStatus !== 'granted') {
          return;
        }

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: '默认通道',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
      } catch (error) {
        console.error('获取通知权限失败:', error);
      }
    }

    registerForPushNotificationsAsync();
  }, []);

  return (
    <GluestackUIProvider mode="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ApiProvider>
            <Stack
              screenOptions={{
                headerShown: true, // 修改为true以显示导航头部
                headerBackTitle: '返回', // 为返回按钮添加文字
                headerTintColor: '#E53E3E', // 设置返回按钮和标题颜色为蓝色
                headerStyle: {
                  backgroundColor: '#ffffff', // 设置导航栏背景颜色为白色
                },
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  header: () => <Header />,
                }}
              />
              <Stack.Screen name="+not-found" />
              <Stack.Screen
                name="login/index"
                options={{
                  title: '登录',
                }}
              />
              <Stack.Screen
                name="forgot-password/index"
                options={{
                  title: '找回密码',
                }}
              />
              <Stack.Screen
                name="device-management/[id]"
                options={{
                  title: '设备管理',
                }}
              />
              <Stack.Screen
                name="register/index"
                options={{
                  title: '注册',
                }}
              />
              <Stack.Screen
                name="device-settings/[id]"
                options={{
                  title: '设备设置',
                }}
              />
              <Stack.Screen
                name="access-logs/[id]"
                options={{
                  title: '访问记录',
                }}
              />
              <Stack.Screen
                name="security-settings/[id]"
                options={{
                  title: '安全设置',
                }}
              />
              <Stack.Screen
                name="global-settings/index"
                options={{
                  title: '全局设置',
                }}
              />
              <Stack.Screen
                name="device-detail/[id]"
                options={{
                  title: '设备详情',
                }}
              />
              <Stack.Screen
                name="emergency-contacts/[id]"
                options={{
                  title: '紧急联系人',
                }}
              />
              <Stack.Screen
                name="firmware-update/[id]"
                options={{
                  title: '固件更新',
                }}
              />
              <Stack.Screen
                name="factory-reset/[id]"
                options={{
                  title: '恢复出厂设置',
                }}
              />
              <Stack.Screen
                name="temporary-passwords/index"
                options={{
                  title: '临时密码',
                }}
              />
            </Stack>
            <ToastProvider />
          </ApiProvider>
          {/* <SocketProvider>

        </SocketProvider> */}
        </AuthProvider>

        <DevToolsBubble onCopy={onCopy} />
      </QueryClientProvider>
    </GluestackUIProvider>
  );
}
