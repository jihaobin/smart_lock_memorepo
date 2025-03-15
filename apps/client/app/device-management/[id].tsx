'use client';

import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ChevronRight,
  Settings,
  Battery,
  Wifi,
  WifiOff,
  Info,
  Users,
  Key,
  Shield,
} from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { TouchableOpacity, ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export default function DeviceManagement() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [device, setDevice] = useState<{
    id: number;
    name: string;
    model: string;
    batteryLevel: number;
    isOnline: boolean;
    firmwareVersion: string;
    lastUpdate: string;
  } | null>(null);

  // // 模拟授权用户数据
  // const [authorizedUsers, setAuthorizedUsers] = useState([
  //   {
  //     id: '1',
  //     name: '张三',
  //     avatar: 'https://i.pravatar.cc/150?img=1',
  //     role: '管理员',
  //     lastAccess: '今天 10:30',
  //   },
  //   {
  //     id: '2',
  //     name: '李四',
  //     avatar: 'https://i.pravatar.cc/150?img=2',
  //     role: '普通用户',
  //     lastAccess: '昨天 15:45',
  //   },
  //   {
  //     id: '3',
  //     name: '王五',
  //     avatar: 'https://i.pravatar.cc/150?img=3',
  //     role: '临时用户',
  //     lastAccess: '3天前',
  //   },
  // ]);

  useEffect(() => {
    // 在实际应用中，这里应该从API获取设备详情
    // 这里我们模拟API调用
    setDevice({
      id: Number(id),
      name: `设备 ${id}`,
      model: '智能门锁 Pro',
      batteryLevel: 85,
      isOnline: true,
      firmwareVersion: '2.1.4',
      lastUpdate: '2023-11-15',
    });
  }, [id]);

  if (!device) {
    return (
      <Box className="flex-1 items-center justify-center">
        <Text>加载中...</Text>
      </Box>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="px-4 py-6">
        <Box className="rounded-lg bg-white overflow-hidden mb-6 border border-gray-200">
          <Box className="p-4">
            <HStack className="items-center justify-between mb-2">
              <Text className="font-medium">{device.name}</Text>
              <HStack className="items-center space-x-2 gap-2">
                {device.isOnline ? (
                  <Icon as={Wifi} className="h-4 w-4 text-green-500" />
                ) : (
                  <Icon as={WifiOff} className="h-4 w-4 text-gray-400" />
                )}
                <HStack className="items-center">
                  <Icon as={Battery} className="h-4 w-4 text-gray-500" />
                  <Text className="ml-1 text-xs text-gray-500">{device.batteryLevel}%</Text>
                </HStack>
              </HStack>
            </HStack>

            <Text className="text-sm text-gray-500 mb-3">{device.model}</Text>

            <HStack className="justify-between">
              <Box className="flex-1">
                <Text className="text-xs text-gray-600">
                  <Text className="font-medium">固件版本:</Text> {device.firmwareVersion}
                </Text>
              </Box>
              <Box className="flex-1">
                <Text className="text-xs text-gray-600">
                  <Text className="font-medium">最后更新:</Text> {device.lastUpdate}
                </Text>
              </Box>
            </HStack>
          </Box>

          <Box className="border-t border-gray-200">
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/device-detail/[id]',
                  params: { id },
                })
              }
              className="flex-row items-center justify-between p-3 active:bg-gray-100"
            >
              <HStack className="items-center">
                <Icon as={Info} className="h-5 w-5 text-gray-500 mr-2" />
                <Text className="text-sm">设备详情</Text>
              </HStack>
              <Icon as={ChevronRight} className="h-5 w-5 text-gray-400" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/temporary-passwords/[deviceId]',
                  params: { deviceId: id },
                })
              }
              className="flex-row items-center justify-between p-3 active:bg-gray-100 border-t border-gray-200"
            >
              <HStack className="items-center">
                <Icon as={Key} className="h-5 w-5 text-gray-500 mr-2" />
                <Text className="text-sm">临时密码管理</Text>
              </HStack>
              <Icon as={ChevronRight} className="h-5 w-5 text-gray-400" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/device-settings/[id]',
                  params: { id },
                })
              }
              className="flex-row items-center justify-between p-3 active:bg-gray-100 border-t border-gray-200"
            >
              <HStack className="items-center">
                <Icon as={Settings} className="h-5 w-5 text-gray-500 mr-2" />
                <Text className="text-sm">设备设置</Text>
              </HStack>
              <Icon as={ChevronRight} className="h-5 w-5 text-gray-400" />
            </TouchableOpacity>
          </Box>
        </Box>

        {/* 授权用户组件 */}
        {/* <Box className="rounded-lg bg-white overflow-hidden mb-6 border border-gray-200">
          <Box className="p-4 border-b border-gray-200">
            <HStack className="items-center justify-between">
              <HStack className="items-center">
                <Icon as={Users} className="h-5 w-5 text-gray-500 mr-2" />
                <Text className="font-medium">授权用户</Text>
              </HStack>
              <Button
                size="sm"
                variant="outline"
                onPress={() =>
                  router.push({
                    pathname: "/device-detail/[id]",
                    params: { id },
                  })
                }
              >
                <Text className="text-sm text-primary">查看全部</Text>
              </Button>
            </HStack>
          </Box>

          <Box>
            {authorizedUsers.map((user) => (
              <Box key={user.id} className="p-4 border-b border-gray-100">
                <HStack className="items-center justify-between">
                  <HStack className="items-center flex-1">
                    <Box className="h-10 w-10 rounded-full overflow-hidden mr-3">
                      <Image
                        source={{ uri: user.avatar }}
                        className="h-full w-full"
                      />
                    </Box>
                    <VStack className="flex-1">
                      <HStack className="items-center">
                        <Text className="font-medium">{user.name}</Text>
                        <Box className="ml-2 px-2 py-0.5 bg-blue-50 rounded">
                          <Text className="text-xs text-blue-600">
                            {user.role}
                          </Text>
                        </Box>
                      </HStack>
                      <Text className="text-xs text-gray-500">
                        上次访问: {user.lastAccess}
                      </Text>
                    </VStack>
                  </HStack>
                  <TouchableOpacity>
                    <Icon as={MoreVertical} className="h-5 w-5 text-gray-400" />
                  </TouchableOpacity>
                </HStack>
              </Box>
            ))}
          </Box>

          <TouchableOpacity
            className="p-4 flex-row items-center justify-center"
            onPress={() =>
              router.push({
                pathname: "/device-detail/[id]",
                params: { id },
              })
            }
          >
            <Icon as={Users} className="h-5 w-5 text-primary mr-2" />
            <Text className="text-primary">添加用户</Text>
          </TouchableOpacity>
        </Box> */}

        <VStack className="space-y-3 gap-3">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/security-settings/[id]',
                params: { id },
              })
            }
            className="flex-row items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
          >
            <HStack className="items-center">
              <Box className="h-10 w-10 rounded-full bg-red-100 items-center justify-center mr-3">
                <Icon as={Shield} className="h-5 w-5 text-primary" />
              </Box>
              <VStack>
                <Text className="font-medium">安全设置</Text>
                <Text className="text-xs text-gray-500">管理设备的安全选项和警报设置</Text>
              </VStack>
            </HStack>
            <Icon as={ChevronRight} className="h-5 w-5 text-gray-400" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/access-logs/[id]',
                params: { id },
              })
            }
            className="flex-row items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
          >
            <HStack className="items-center">
              <Box className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Icon as={Users} className="h-5 w-5 text-blue-500" />
              </Box>
              <VStack>
                <Text className="font-medium">访问记录</Text>
                <Text className="text-xs text-gray-500">查看设备的访问历史记录</Text>
              </VStack>
            </HStack>
            <Icon as={ChevronRight} className="h-5 w-5 text-gray-400" />
          </TouchableOpacity>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
