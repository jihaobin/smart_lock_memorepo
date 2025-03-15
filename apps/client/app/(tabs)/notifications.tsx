import { CheckCircle } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';

import { NotificationItem } from '@/components/notification-item';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'access' as const,
      title: '张三已进入',
      description: '使用密码开锁进入',
      time: '今天 14:30',
      isRead: false,
    },
    {
      id: 2,
      type: 'alert' as const,
      title: '门锁电量低',
      description: '前门锁电量低于20%，请及时更换电池',
      time: '今天 12:15',
      isRead: false,
    },
    {
      id: 3,
      type: 'temporary' as const,
      title: '临时密码已使用',
      description: '临时密码 #12345 已被使用',
      time: '今天 10:30',
      isRead: true,
    },
    {
      id: 4,
      type: 'system' as const,
      title: '系统更新',
      description: '门锁固件已更新至最新版本',
      time: '昨天 18:22',
      isRead: true,
    },
    {
      id: 5,
      type: 'access' as const,
      title: '李四已进入',
      description: '使用指纹开锁进入',
      time: '昨天 16:45',
      isRead: true,
    },
  ]);

  const markAllAsRead = () => {
    setNotifications(
      notifications.map(notification => ({
        ...notification,
        isRead: true,
      }))
    );
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="px-4 py-4">
        {/* 顶部导航栏 */}
        <HStack className="items-center justify-end mb-6">
          <TouchableOpacity className="flex-row items-center" onPress={markAllAsRead}>
            <Icon as={CheckCircle} className="h-4 w-4 mr-1 text-primary" />
            <Text className="text-sm text-primary">全部已读</Text>
          </TouchableOpacity>
        </HStack>

        {/* 通知标题和未读数量 */}
        <HStack className="items-center justify-between mb-4">
          <Text className="text-lg font-bold mr-2">通知</Text>
          {unreadCount > 0 && (
            <Box className="px-2 py-0.5 bg-red-500 rounded-full">
              <Text className="text-xs text-white">{unreadCount} 未读</Text>
            </Box>
          )}
        </HStack>

        {/* 通知列表 */}
        <VStack>
          {notifications.map(notification => (
            <NotificationItem
              key={notification.id}
              type={notification.type}
              title={notification.title}
              description={notification.description}
              time={notification.time}
              isRead={notification.isRead}
            />
          ))}
        </VStack>

        {/* 底部提示 */}
        <Box className="items-center py-4 mt-2">
          <Text className="text-sm text-gray-500">没有更多通知</Text>
        </Box>
      </VStack>
    </ScrollView>
  );
}
