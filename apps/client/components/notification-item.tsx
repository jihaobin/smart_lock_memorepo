import { NOTIFICATION_ENUM, NotiFIcationListItem } from '@smart-lock/shared';
import {
  Bell,
  Battery,
  Wifi,
  WifiOff,
  DoorOpen,
  DoorClosed,
  Download,
  ShieldX,
} from 'lucide-react-native';

import { Box } from './ui/box';
import { HStack } from './ui/hstack';
import { Icon } from './ui/icon';
import { Text } from './ui/text';
import { VStack } from './ui/vstack';

interface NotificationItemProps {
  notification: NotiFIcationListItem;
  className?: string;
}

export function NotificationItem({ notification, className }: NotificationItemProps) {
  const { type, message, timestamp, device, data } = notification;

  // 格式化时间
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    // 格式化小时和分钟
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    // 获取星期几
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];

    if (diffDays === 0) {
      return `今天 ${timeStr}`;
    } else if (diffDays === 1) {
      return `昨天 ${timeStr}`;
    } else if (diffDays < 7) {
      return `${weekday} ${timeStr}`;
    } else {
      return `${timeStr}`;
    }
  };

  // 获取图标
  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_ENUM.DOORBELL:
        return <Icon className="h-5 w-5 text-purple-500" as={Bell} />;
      case NOTIFICATION_ENUM.DOOR_OPEN_ALERT:
        return <Icon className="h-5 w-5 text-orange-500" as={DoorOpen} />;
      case NOTIFICATION_ENUM.DEVICE_LOW_BATTERY:
        return <Icon className="h-5 w-5 text-red-500" as={Battery} />;
      case NOTIFICATION_ENUM.DEVICE_BROKEN:
        return <Icon className="h-5 w-5 text-red-600" as={ShieldX} />;
      case NOTIFICATION_ENUM.DEVICE_OPEN:
        return <Icon className="h-5 w-5 text-blue-500" as={DoorOpen} />;
      case NOTIFICATION_ENUM.DEVICE_CLOSE:
        return <Icon className="h-5 w-5 text-green-500" as={DoorClosed} />;
      case NOTIFICATION_ENUM.DEVICE_OFFLINE:
        return <Icon className="h-5 w-5 text-gray-500" as={WifiOff} />;
      case NOTIFICATION_ENUM.DEVICE_ONLINE:
        return <Icon className="h-5 w-5 text-teal-500" as={Wifi} />;
      case NOTIFICATION_ENUM.FIRMWARE_UPDATE:
        return <Icon className="h-5 w-5 text-indigo-500" as={Download} />;
      default:
        return <Icon className="h-5 w-5 text-gray-500" as={Bell} />;
    }
  };

  // 获取背景颜色
  const getBgColor = () => {
    switch (type) {
      case NOTIFICATION_ENUM.DOORBELL:
        return 'bg-purple-50';
      case NOTIFICATION_ENUM.DOOR_OPEN_ALERT:
        return 'bg-orange-50';
      case NOTIFICATION_ENUM.DEVICE_LOW_BATTERY:
        return 'bg-red-50';
      case NOTIFICATION_ENUM.DEVICE_BROKEN:
        return 'bg-red-100';
      case NOTIFICATION_ENUM.DEVICE_OPEN:
        return 'bg-blue-50';
      case NOTIFICATION_ENUM.DEVICE_CLOSE:
        return 'bg-green-50';
      case NOTIFICATION_ENUM.DEVICE_OFFLINE:
        return 'bg-gray-100';
      case NOTIFICATION_ENUM.DEVICE_ONLINE:
        return 'bg-teal-50';
      case NOTIFICATION_ENUM.FIRMWARE_UPDATE:
        return 'bg-indigo-50';
      default:
        return 'bg-gray-50';
    }
  };

  // 获取额外数据显示
  const getExtraDataDisplay = () => {
    if (!data) return null;

    // 根据不同通知类型显示不同的额外数据
    switch (type) {
      case NOTIFICATION_ENUM.DEVICE_LOW_BATTERY:
        return data.device_battery ? (
          <Text className="text-xs text-red-600 font-medium mt-1">
            电量: {data.device_battery}%
          </Text>
        ) : null;
      case NOTIFICATION_ENUM.FIRMWARE_UPDATE:
        return data.device_firmware_version ? (
          <Text className="text-xs text-indigo-600 font-medium mt-1">
            版本: {data.device_firmware_version}
          </Text>
        ) : null;
      case NOTIFICATION_ENUM.DOOR_OPEN_ALERT:
        return data.noOpenTime ? (
          <Text className="text-xs text-orange-600 font-medium mt-1">
            开门时长: {data.noOpenTime}分钟
          </Text>
        ) : null;
      case NOTIFICATION_ENUM.DEVICE_OPEN:
        return data.openType ? (
          <Text className="text-xs text-blue-600 font-medium mt-1">
            开门方式: {getOpenTypeText(data.openType)}
          </Text>
        ) : null;
      case NOTIFICATION_ENUM.DEVICE_BROKEN:
        return <Text className="text-xs text-red-600 font-medium mt-1">{message}</Text>;
      default:
        return null;
    }
  };

  // 获取开门方式的中文描述
  const getOpenTypeText = (openType: string): string => {
    switch (openType) {
      case 'remote':
        return '远程开门';
      case 'temporary_password':
        return '临时密码';
      case 'direct':
        return '直接开门';
      case 'nfc':
        return 'NFC';
      case 'permanent_password':
        return '永久密码';
      case 'face':
        return '人脸识别';
      case 'eye':
        return '瞳孔识别';
      case 'fingerprint':
        return '指纹识别';
      default:
        return openType;
    }
  };

  return (
    <Box className={`rounded-lg overflow-hidden mb-3 ${className}`}>
      <HStack className={`p-4 ${getBgColor()}`}>
        <Box className="h-10 w-10 items-center justify-center rounded-full bg-white mr-3">
          {getIcon()}
        </Box>
        <VStack className="flex-1">
          <HStack className="items-end justify-between gap-2">
            <Text className="font-medium text-gray-900 flex-1">{message}</Text>
            <Text className="text-xs text-gray-500">{formatTime(timestamp)}</Text>
          </HStack>

          {device && (
            <Text className="mt-1 text-sm text-gray-700 font-medium">设备: {device.name}</Text>
          )}

          {getExtraDataDisplay()}
        </VStack>
      </HStack>
    </Box>
  );
}
