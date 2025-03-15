import { Bell, User, Key, AlertTriangle } from 'lucide-react-native';

import { Box } from './ui/box';
import { HStack } from './ui/hstack';
import { Icon } from './ui/icon';
import { Text } from './ui/text';
import { VStack } from './ui/vstack';

type NotificationType = 'access' | 'alert' | 'system' | 'temporary';

interface NotificationItemProps {
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  isRead?: boolean;
  className?: string;
}

export function NotificationItem({
  type,
  title,
  description,
  time,
  isRead = false,
  className,
}: NotificationItemProps) {
  const getIcon = () => {
    switch (type) {
      case 'access':
        return <Icon className="h-5 w-5 text-blue-500" as={User}></Icon>;
      case 'alert':
        return <Icon className="h-5 w-5 text-red-500" as={AlertTriangle}></Icon>;
      case 'system':
        return <Icon className="h-5 w-5 text-yellow-500" as={Bell}></Icon>;
      case 'temporary':
        return <Icon className="h-5 w-5 text-green-500" as={Key}></Icon>;
      default:
        return <Icon className="h-5 w-5 text-gray-500" as={Bell}></Icon>;
    }
  };

  // 获取背景颜色
  const getBgColor = () => {
    switch (type) {
      case 'access':
        return 'bg-blue-50';
      case 'alert':
        return 'bg-red-50';
      case 'system':
        return 'bg-yellow-50';
      case 'temporary':
        return 'bg-green-50';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <Box className={`rounded-lg overflow-hidden mb-3 ${className}`}>
      <HStack className={`p-4 ${getBgColor()} ${!isRead ? '' : 'opacity-80'}`}>
        <Box className="h-10 w-10 items-center justify-center rounded-full bg-white mr-3">
          {getIcon()}
        </Box>
        <VStack className="flex-1">
          <HStack className="items-center justify-between">
            <Text className="font-medium text-gray-900">{title}</Text>
            <Text className="text-xs text-gray-500">{time}</Text>
          </HStack>
          <Text className="mt-1 text-sm text-gray-600">{description}</Text>
        </VStack>
        {!isRead && (
          <Box className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 mt-2 mr-2"></Box>
        )}
      </HStack>
    </Box>
  );
}
