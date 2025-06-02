import { Link } from 'expo-router';
import { Bell, Key, User, Settings, Shield, ChevronRight } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { DoorCard } from '@/components/door-card';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useAuth } from '@/contexts/auth-context';

export default function Home() {
  const { user } = useAuth();
  // 模拟多个设备数据
  const devices = [
    {
      id: 1,
      name: '前门',
      status: 'locked',
      batteryLevel: 85,
      isOnline: true,
      lastActivity: '今天 08:32',
    },
    {
      id: 2,
      name: '后门',
      status: 'unlocked',
      batteryLevel: 72,
      isOnline: true,
      lastActivity: '今天 10:15',
    },
  ];

  return (
    <Box className="flex-1 bg-white">
      <ScrollView style={styles.scrollView}>
        <VStack className="p-4 flex-1">
          <HStack className="justify-between mb-6">
            <VStack>
              <Text className="text-2xl font-bold">您好，{user?.nikeName ?? '用户'}</Text>
              <Text className="text-gray-500">欢迎使用智能门锁</Text>
            </VStack>
            <Link href="/user-management" asChild>
              <Pressable className="h-12 w-12 rounded-full bg-gray-200 items-center justify-center">
                <Icon className="text-gray-600" as={User} />
              </Pressable>
            </Link>
          </HStack>

          <VStack className="mb-6">
            <HStack className="justify-between items-center mb-3">
              <Text className="text-lg font-medium">我的设备</Text>
              <Link href="/device-management" asChild>
                <Pressable>
                  <HStack className="items-center">
                    <Text className="text-sm text-primary-500">查看全部</Text>
                    <ChevronRight size={16} className="text-primary-500" />
                  </HStack>
                </Pressable>
              </Link>
            </HStack>
            {devices.map(device => (
              <Box key={device.id} className="mb-3">
                <DoorCard
                  name={device.name}
                  status={device.status as 'locked' | 'unlocked'}
                  batteryLevel={device.batteryLevel}
                  isOnline={device.isOnline}
                  lastActivity={device.lastActivity}
                />
              </Box>
            ))}
          </VStack>

          <VStack className="mb-6">
            <Text className="text-lg font-medium mb-3">快捷功能</Text>
            <HStack className="justify-between">
              <Link href="/remote-unlock" asChild>
                <Pressable className="items-center">
                  <Box className="h-14 w-14 rounded-full bg-red-100 items-center justify-center mb-1">
                    <Icon className="text-primary-500" as={Key} />
                  </Box>
                  <Text className="text-xs text-center">远程开锁</Text>
                </Pressable>
              </Link>
              <Link href="/temporary-passwords" asChild>
                <Pressable className="items-center">
                  <Box className="h-14 w-14 rounded-full bg-yellow-100 items-center justify-center mb-1">
                    <Icon className="text-yellow-500" as={Key} />
                  </Box>
                  <Text className="text-xs text-center">临时密码</Text>
                </Pressable>
              </Link>
              <Link href="/notifications" asChild>
                <Pressable className="items-center">
                  <Box className="h-14 w-14 rounded-full bg-blue-100 items-center justify-center mb-1">
                    <Icon className="text-blue-500" as={Bell} />
                  </Box>
                  <Text className="text-xs text-center">消息通知</Text>
                </Pressable>
              </Link>
              <Link href="/device-management" asChild>
                <Pressable className="items-center">
                  <Box className="h-14 w-14 rounded-full bg-gray-100 items-center justify-center mb-1">
                    <Icon className="text-gray-500" as={Settings} />
                  </Box>
                  <Text className="text-xs text-center">设备管理</Text>
                </Pressable>
              </Link>
            </HStack>
          </VStack>

          <VStack className="mb-6">
            <Text className="text-lg font-medium mb-3">最近活动</Text>
            <VStack space="sm">
              <Box className="p-3 border rounded-lg bg-white">
                <HStack className="items-center">
                  <Box className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Icon className="text-blue-500" as={User} />
                  </Box>
                  <VStack>
                    <Text className="text-sm font-medium">用户张三已进入（前门）</Text>
                    <Text className="text-xs text-gray-500">今天 12:45</Text>
                  </VStack>
                </HStack>
              </Box>
              <Box className="p-3 border rounded-lg bg-white">
                <HStack className="items-center">
                  <Box className="h-10 w-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Icon className="text-green-500" as={Key} />
                  </Box>
                  <VStack>
                    <Text className="text-sm font-medium">临时密码已使用（后门）</Text>
                    <Text className="text-xs text-gray-500">今天 10:30</Text>
                  </VStack>
                </HStack>
              </Box>
              <Box className="p-3 border rounded-lg bg-white">
                <HStack className="items-center">
                  <Box className="h-10 w-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <Icon className="text-primary-500" as={Shield} />
                  </Box>
                  <VStack>
                    <Text className="text-sm font-medium">前门锁电量低</Text>
                    <Text className="text-xs text-gray-500">昨天 18:22</Text>
                  </VStack>
                </HStack>
              </Box>
            </VStack>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
});
