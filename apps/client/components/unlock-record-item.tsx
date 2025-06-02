import dayjs from 'dayjs';
import {
  User,
  Fingerprint,
  Key,
  Smartphone,
  LucideIcon,
  Lock,
  CreditCard,
  ScanEye,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Hash,
  Target,
} from 'lucide-react-native';
import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Image } from 'expo-image';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UnlockRecord } from '@/services/unlockRecord';
import { Button, ButtonText } from './ui/button';
import { useImageViewer } from '@/contexts/full-image-context';

// 定义解锁方式详情
export const unlockMethodDetails: Record<
  string,
  {
    icon: LucideIcon;
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  permanent_password: {
    icon: Lock,
    label: '密码',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-100',
  },
  fingerprint: {
    icon: Fingerprint,
    label: '指纹',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-100',
  },
  remote: {
    icon: Smartphone,
    label: '远程',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-100',
  },
  nfc: {
    icon: CreditCard,
    label: '门卡',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-100',
  },
  temporary_password: {
    icon: Lock,
    label: '临时密码',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-100',
  },
  face: {
    icon: User,
    label: '人脸',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-100',
  },
  eye: {
    icon: ScanEye,
    label: '瞳孔',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-100',
  },
  key: {
    icon: Key,
    label: '钥匙',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-100',
  },
};

export interface UnlockRecordItemProps {
  record: UnlockRecord;
  _showUser?: boolean;
}

export const UnlockRecordItem = memo(({ record, _showUser = true }: UnlockRecordItemProps) => {
  const methodDetails = unlockMethodDetails[record.unlockType] || unlockMethodDetails.key;
  const UnlockIcon = methodDetails.icon;

  const { showImage } = useImageViewer();

  // 处理解锁数据的额外信息
  const renderExtraInfo = () => {
    switch (record.unlockType) {
      case 'temporary_password': {
        // 临时密码特殊处理
        const tempInfo = record.unlockData?.temporaryInfo;
        if (!tempInfo) return null;

        const isExpiringSoon =
          tempInfo.expiresAt && dayjs(tempInfo.expiresAt).diff(dayjs(), 'hours') < 24;
        const isLowUses = tempInfo.remainingUses !== undefined && tempInfo.remainingUses <= 3;

        return (
          <VStack className="mt-2 space-y-3">
            <Box className="bg-orange-50 rounded-xl p-3 border border-orange-100">
              <VStack className="space-y-2">
                {tempInfo.expiresAt && (
                  <HStack className="items-center gap-2">
                    <Icon
                      as={Calendar}
                      className={cn('h-4 w-4', isExpiringSoon ? 'text-red-600' : 'text-orange-600')}
                    />
                    <VStack className="flex-1">
                      <Text className="text-xs text-gray-600 font-medium">到期时间</Text>
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          isExpiringSoon ? 'text-red-600' : 'text-orange-700'
                        )}
                      >
                        {dayjs(tempInfo.expiresAt).format('YYYY-MM-DD HH:mm')}
                      </Text>
                      {isExpiringSoon && <Text className="text-xs text-red-500">即将到期</Text>}
                    </VStack>
                  </HStack>
                )}

                {tempInfo.remainingUses !== undefined && (
                  <HStack className="items-center gap-2">
                    <Icon
                      as={Hash}
                      className={cn('h-4 w-4', isLowUses ? 'text-red-600' : 'text-orange-600')}
                    />
                    <VStack className="flex-1">
                      <Text className="text-xs text-gray-600 font-medium">剩余使用次数</Text>
                      <HStack className="items-center gap-2">
                        <Text
                          className={cn(
                            'text-sm font-medium',
                            isLowUses ? 'text-red-600' : 'text-orange-700'
                          )}
                        >
                          {tempInfo.remainingUses} 次
                        </Text>
                        {isLowUses && (
                          <Text className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded-full">
                            次数不足
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </HStack>
                )}
              </VStack>
            </Box>
          </VStack>
        );
      }
      case 'fingerprint': {
        // 指纹特殊处理
        const score = record.unlockData?.fingerprintMatchScore;
        if (!score) return null;

        const getScoreColor = (score: number) => {
          if (score >= 90)
            return {
              bg: 'bg-green-50',
              text: 'text-green-700',
              progress: 'bg-green-500',
              border: 'border-green-100',
            };
          if (score >= 70)
            return {
              bg: 'bg-yellow-50',
              text: 'text-yellow-700',
              progress: 'bg-yellow-500',
              border: 'border-yellow-100',
            };
          return {
            bg: 'bg-red-50',
            text: 'text-red-700',
            progress: 'bg-red-500',
            border: 'border-red-100',
          };
        };

        const colors = getScoreColor(score);

        return (
          <VStack className="mt-2 space-y-2">
            <Box className={cn('rounded-xl p-3 border', colors.bg, colors.border)}>
              <HStack className="items-center gap-3">
                <Icon as={Target} className={cn('h-5 w-5', colors.text)} />
                <VStack className="flex-1 gap-1">
                  <HStack className="items-center justify-between">
                    <Text className="text-xs text-gray-600 font-medium">指纹匹配度</Text>
                    <Text className={cn('text-sm font-bold', colors.text)}>{score}%</Text>
                  </HStack>
                  <Progress className="h-2 bg-gray-200" value={score}>
                    <ProgressFilledTrack className={cn('h-full rounded-full', colors.progress)} />
                  </Progress>
                  <Text className={cn('text-xs', colors.text)}>
                    {score >= 90 ? '匹配度极高' : score >= 70 ? '匹配度良好' : '匹配度较低'}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        );
      }
      case 'face': {
        // 人脸特殊处理
        const score = record.unlockData?.faceMatchScore;
        if (!score) return null;

        const getScoreColor = (score: number) => {
          if (score >= 90)
            return {
              bg: 'bg-green-50',
              text: 'text-green-700',
              progress: 'bg-green-500',
              border: 'border-green-100',
            };
          if (score >= 70)
            return {
              bg: 'bg-yellow-50',
              text: 'text-yellow-700',
              progress: 'bg-yellow-500',
              border: 'border-yellow-100',
            };
          return {
            bg: 'bg-red-50',
            text: 'text-red-700',
            progress: 'bg-red-500',
            border: 'border-red-100',
          };
        };

        const colors = getScoreColor(score);

        return (
          <VStack className="mt-2 space-y-2">
            <Box className={cn('rounded-xl p-3 border', colors.bg, colors.border)}>
              <HStack className="items-center gap-3">
                <Icon as={Target} className={cn('h-5 w-5', colors.text)} />
                <VStack className="flex-1 gap-1">
                  <HStack className="items-center justify-between">
                    <Text className="text-xs text-gray-600 font-medium">人脸匹配度</Text>
                    <Text className={cn('text-sm font-bold', colors.text)}>{score}%</Text>
                  </HStack>
                  <Progress className="h-2 bg-gray-200" value={score}>
                    <ProgressFilledTrack className={cn('h-full rounded-full', colors.progress)} />
                  </Progress>
                  <Text className={cn('text-xs', colors.text)}>
                    {score >= 90 ? '匹配度极高' : score >= 70 ? '匹配度良好' : '匹配度较低'}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        );
      }
      case 'eye': {
        // 瞳孔特殊处理
        const score = record.unlockData?.eyeMatchScore;
        if (!score) return null;

        const getScoreColor = (score: number) => {
          if (score >= 90)
            return {
              bg: 'bg-green-50',
              text: 'text-green-700',
              progress: 'bg-green-500',
              border: 'border-green-100',
            };
          if (score >= 70)
            return {
              bg: 'bg-yellow-50',
              text: 'text-yellow-700',
              progress: 'bg-yellow-500',
              border: 'border-yellow-100',
            };
          return {
            bg: 'bg-red-50',
            text: 'text-red-700',
            progress: 'bg-red-500',
            border: 'border-red-100',
          };
        };

        const colors = getScoreColor(score);

        return (
          <VStack className="mt-2 space-y-2">
            <Box className={cn('rounded-xl p-3 border', colors.bg, colors.border)}>
              <HStack className="items-center gap-3">
                <Icon as={Target} className={cn('h-5 w-5', colors.text)} />
                <VStack className="flex-1 gap-1">
                  <HStack className="items-center justify-between">
                    <Text className="text-xs text-gray-600 font-medium">瞳孔匹配度</Text>
                    <Text className={cn('text-sm font-bold', colors.text)}>{score}%</Text>
                  </HStack>
                  <Progress className="h-2 bg-gray-200" value={score}>
                    <ProgressFilledTrack className={cn('h-full rounded-full', colors.progress)} />
                  </Progress>
                  <Text className={cn('text-xs', colors.text)}>
                    {score >= 90 ? '匹配度极高' : score >= 70 ? '匹配度良好' : '匹配度较低'}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </VStack>
        );
      }
      case 'remote': {
        // 远程开锁特殊处理
        const success = record.unlockData?.isRemoteSuccess;
        const remoteImage = record.unlockData?.remoteImage;

        return (
          <VStack className="mt-2 space-y-3">
            {/* 状态指示器 */}
            <HStack className="items-center gap-2">
              <Icon
                as={success ? CheckCircle : XCircle}
                className={cn('h-4 w-4', success ? 'text-green-600' : 'text-red-600')}
              />
              <Text
                className={cn('text-sm font-medium', success ? 'text-green-600' : 'text-red-600')}
              >
                {success ? '远程开锁成功' : '远程开锁失败'}
              </Text>
            </HStack>

            {/* 图片预览区域 */}
            {remoteImage && (
              <Box className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <HStack className="items-center gap-3">
                  {/* 图片缩略图 */}
                  <Box className="relative">
                    <Image
                      source={{ uri: remoteImage }}
                      style={{ width: 80, height: 80, borderRadius: 4 }}
                      className="rounded-lg border border-gray-200"
                      alt="摄像头拍摄图片"
                    />
                    <Box className="absolute inset-0 bg-black/10 rounded-lg" />
                  </Box>

                  {/* 查看按钮 */}
                  <VStack className="flex-1 gap-2">
                    <Text className="text-sm font-medium text-gray-700">摄像头拍摄图片</Text>
                    <Text className="text-xs text-gray-500">点击查看完整图片</Text>
                    <Button
                      onPress={() => showImage(remoteImage)}
                      size="sm"
                      className="bg-purple-100 border-purple-200 self-start data-[hover=true]:bg-purple-300 data-[active=true]:bg-purple-300"
                    >
                      <HStack className="items-center gap-1">
                        <Icon as={Eye} className="h-4 w-4 text-purple-700" />
                        <ButtonText className="text-purple-700 text-xs font-medium">
                          查看大图
                        </ButtonText>
                      </HStack>
                    </Button>
                  </VStack>
                </HStack>
              </Box>
            )}
          </VStack>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Box
      className={cn(
        'rounded-lg p-3 mb-2',
        methodDetails.bgColor,
        `border-${methodDetails.borderColor}`
      )}
    >
      <HStack className="items-center">
        <Box
          className={cn(
            'h-10 w-10 rounded-full items-center justify-center',
            methodDetails.bgColor
          )}
        >
          <Icon as={UnlockIcon} className={cn('h-5 w-5', methodDetails.textColor)} />
        </Box>

        <VStack className="flex-1 ml-3">
          <HStack className="items-center justify-between">
            <Text className="font-medium text-gray-800">
              {record.unlockData.friendName || '未知用户'}
            </Text>
            <Text className={cn('text-sm', methodDetails.textColor)}>
              {dayjs(record.timestamp).format('HH:mm')}
            </Text>
          </HStack>

          <HStack className="items-center mt-1 justify-between gap-2">
            <HStack className="items-center space-x-2 gap-2">
              <Text className={cn('text-sm font-medium', methodDetails.textColor)}>
                {methodDetails.label}开锁
              </Text>
              <Text className="text-xs text-gray-500">
                {record.unlockType === 'remote' ? '远程访问' : '本地访问'}
              </Text>
            </HStack>
            <Text className="text-xs text-gray-500">
              {dayjs(record.timestamp).format('YYYY-MM-DD')}
            </Text>
          </HStack>

          {/* 额外信息 */}
          {renderExtraInfo()}
        </VStack>
      </HStack>
    </Box>
  );
});
