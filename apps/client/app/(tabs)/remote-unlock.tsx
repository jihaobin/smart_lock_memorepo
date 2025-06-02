import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Zoomable } from '@likashefqet/react-native-image-zoom';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import {
  Camera,
  Check,
  Wifi,
  WifiOff,
  DoorOpen,
  DoorClosed,
  BatteryMedium,
  BatteryLow,
  BatteryWarningIcon,
  BatteryFull,
} from 'lucide-react-native';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollView, TouchableOpacity, Alert } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { ChevronDownIcon, Icon } from '@/components/ui/icon';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { UnlockRecordItem } from '@/components/unlock-record-item';
import { UnlockRecordItemSkeleton } from '@/components/unlock-record-item-skeleton';
import { useDevices } from '@/hooks/useDevices';
import { useDeviceSocket } from '@/hooks/useDeviceSocket';
import { cn } from '@/lib/utils';
import { useUnlockRecordService } from '@/services/unlockRecord';
import { getDeviceDisplayName } from '@/utils/device-utils';
import { useImageViewer } from '@/contexts/full-image-context';

// 图片加载的占位符
const blurhash =
  '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';
export default function RemoteUnlock() {
  // 使用设备钩子获取设备列表
  const { devices, remoteUnlock, status } = useDevices();
  // 使用WebSocket钩子监测设备在线状态和接收开锁结果
  const {
    isDeviceOnline,
    isDeviceUnlocking,
    markDeviceUnlocking,
    getLatestUnlockResult,
    clearUnlockResult,
    getDeviceLockStatus,
  } = useDeviceSocket();
  // 获取解锁记录服务
  const unlockRecordService = useUnlockRecordService();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  // 添加两个新状态来跟踪操作时间
  const [currentOperationStartTime, setCurrentOperationStartTime] = useState<number>(0);
  const [unlockResultTimestamp, setUnlockResultTimestamp] = useState<number>(0);
  // 图片查看器
  const { showImage } = useImageViewer();

  // 获取选中设备的最新开锁结果
  const latestUnlockResult = useMemo(
    () => (selectedDeviceId ? getLatestUnlockResult(selectedDeviceId) : undefined),
    [selectedDeviceId, getLatestUnlockResult]
  );

  // 获取选中设备的状态
  const selectDeviceStatus = useMemo(
    () => (selectedDeviceId ? getDeviceLockStatus(selectedDeviceId) : undefined),
    [selectedDeviceId, getDeviceLockStatus]
  );

  // 设备是否正在开锁中
  const unlocking = useMemo(
    () => (selectedDeviceId ? isDeviceUnlocking(selectedDeviceId) : false),
    [selectedDeviceId, isDeviceUnlocking]
  );

  // 获取选中设备的最近访问记录
  const {
    data: recentRecordsData,
    isLoading: isLoadingRecords,
    isError: isErrorRecords,
    refetch: refetchRecords,
  } = useQuery({
    queryKey: ['recentUnlockRecords', selectedDeviceId],
    queryFn: async () => {
      if (!selectedDeviceId) return { items: [], total: 0, page: 1, limit: 3 };

      const params = {
        deviceId: selectedDeviceId,
        page: 1,
        pageSize: 3, // 只获取最近的3条记录
      };

      return unlockRecordService.getUnlockRecords(params);
    },
    enabled: !!selectedDeviceId, // 只有当选择了设备时才启用查询
  });

  // 解锁记录数据
  const recentRecords = recentRecordsData?.items || [];

  // 当设备列表加载完成后，选择第一个设备
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  // 找到选中的设备对象
  const selectedDevice = useMemo(() => {
    return devices.find(device => device.id === selectedDeviceId);
  }, [devices, selectedDeviceId]);

  // 检查选中设备是否在线
  const isSelectedDeviceOnline = useMemo(() => {
    if (!selectedDeviceId) return false;
    return isDeviceOnline(selectedDeviceId);
  }, [selectedDeviceId, isDeviceOnline]);

  // 处理开锁操作
  const handleUnlock = useCallback(async () => {
    if (!selectedDeviceId) {
      Alert.alert('错误', '请选择一个设备');
      return;
    }

    if (!isSelectedDeviceOnline) {
      Alert.alert('设备离线', '当前设备不在线，无法执行远程开锁操作');
      setShowConfirmation(false);
      return;
    }

    // 获取设备锁状态，如果已经是开启状态，显示提示
    if (selectDeviceStatus?.isOpen) {
      Alert.alert('开锁失败', '门锁已处于开启状态，无需再次开锁');
      setShowConfirmation(false);
      return;
    }

    // 清除之前的开锁结果
    clearUnlockResult(selectedDeviceId);

    // 设置当前操作开始时间
    setCurrentOperationStartTime(Date.now());

    // 标记设备为开锁中状态
    markDeviceUnlocking(selectedDeviceId);

    try {
      console.log('开锁了');
      // 发送开锁请求
      const result = await remoteUnlock(selectedDeviceId);

      if (!result.success) {
        // 如果请求本身失败，显示错误
        Alert.alert('开锁失败', result.message || '远程开锁操作失败，请稍后重试');
        // 不再自动关闭确认对话框，让用户可以看到失败界面和重试按钮
      } else {
        // 请求成功发送，告知用户等待设备反馈
        // 注意：此时设备仍然处于"开锁中"状态，需要等待WebSocket的unlockResult事件
      }
    } catch (error) {
      console.error('开锁操作异常:', error);
      Alert.alert('开锁错误', '远程开锁操作出现异常，请稍后重试');
      // 不再自动关闭确认对话框，让用户可以看到失败界面和重试按钮
    } finally {
    }
  }, [
    selectedDeviceId,
    isSelectedDeviceOnline,
    markDeviceUnlocking,
    remoteUnlock,
    clearUnlockResult,
    getDeviceLockStatus,
  ]);

  // 监听unlockResult变化，处理开锁结果
  useEffect(() => {
    if (!selectedDeviceId || !latestUnlockResult) return;

    // 更新结果时间戳
    setUnlockResultTimestamp(Date.now());

    // 如果收到了选中设备的开锁结果，且正在显示确认对话框
    if (showConfirmation) {
      // 如果开锁成功，延迟关闭确认对话框，以便用户看到成功提示
      if (latestUnlockResult.success) {
        setTimeout(() => {
          setShowConfirmation(false);
        }, 3000);
      }
      // 不再自动关闭失败结果的确认对话框，让用户可以看到失败界面和重试按钮
    }
  }, [selectedDeviceId, latestUnlockResult, showConfirmation]);

  // 在设备变化或成功开锁后重新获取记录
  useEffect(() => {
    if (selectedDeviceId && latestUnlockResult?.success) {
      refetchRecords();
    }
  }, [selectedDeviceId, latestUnlockResult, refetchRecords]);

  // 如果正在加载设备列表，显示加载指示器
  if (status.isLoading) {
    return (
      <Box className="flex-1 items-center justify-center bg-background">
        <Spinner size="large" />
        <Text className="mt-4">加载设备中...</Text>
      </Box>
    );
  }

  // 如果没有设备，显示提示信息
  if (devices.length === 0) {
    return (
      <Box className="flex-1 items-center justify-center bg-background px-4">
        <Icon as={MaterialCommunityIcons} className="text-gray-400" size="lg" />
        <Text className="mt-4 text-lg font-medium text-center">未找到设备</Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          您尚未绑定任何智能锁设备，请先去设备管理页面添加设备
        </Text>
        <Button className="mt-6">
          <ButtonText>管理设备</ButtonText>
        </Button>
      </Box>
    );
  }

  // 计算是否显示开锁成功状态
  const showUnlockSuccess =
    showConfirmation &&
    latestUnlockResult?.success &&
    !unlocking &&
    unlockResultTimestamp > currentOperationStartTime;

  // 计算是否显示有效的开锁失败状态
  const showUnlockFailed =
    !unlocking &&
    latestUnlockResult &&
    !latestUnlockResult.success &&
    unlockResultTimestamp > currentOperationStartTime;

  // 点击远程开锁按钮
  const handleShowConfirmation = () => {
    // 清除之前的开锁结果
    if (selectedDeviceId) {
      clearUnlockResult(selectedDeviceId);
    }

    // 设置当前操作的开始时间
    setCurrentOperationStartTime(Date.now());
    setShowConfirmation(true);
  };

  function getRemoteUnlockButtonText() {
    if (isDeviceUnlocking(selectedDeviceId)) {
      return '正在开锁...';
    }

    if (!selectDeviceStatus?.isOnline) {
      return '当前设备已离线，无法开锁';
    }

    if (selectDeviceStatus?.isOnline && selectDeviceStatus?.isOpen) {
      return '当前设备已处于开锁状态，请勿重复操作';
    }

    if (selectDeviceStatus.batteryLevel === 0) {
      return '当前设备电量为0，请及时充电';
    }

    return '远程开锁';
  }

  function getBatteryContent() {
    const batteryLevel = selectDeviceStatus?.batteryLevel;
    if (batteryLevel === null || batteryLevel === undefined) return undefined;

    let iconComponent, iconClass, text;

    if (batteryLevel <= 10) {
      iconComponent = BatteryWarningIcon;
      iconClass = 'text-red-500';
      text = '电池电量过低，请及时充电';
    } else if (batteryLevel <= 20) {
      iconComponent = BatteryLow;
      iconClass = 'text-amber-400';
      text = '电池电量过低，请及时充电';
    } else if (batteryLevel === 100) {
      iconComponent = BatteryFull;
      iconClass = 'text-green-500';
      text = '当前电量已满';
    } else {
      iconComponent = BatteryMedium;
      iconClass = '';
      text = '当前电量正常';
    }

    return (
      <HStack className="items-center">
        <Icon as={iconComponent} className={`w-4 h-4 mr-1 ${iconClass}`} />
        <Text className={`text-sm ${iconClass}`}>{text}</Text>
      </HStack>
    );
  }

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="px-4 py-6 gap-4">
        <Box className="rounded-xl overflow-hidden border border-border shadow-sm bg-card">
          <Box className="aspect-video relative">
            {showConfirmation ? (
              <Box className="absolute inset-0 items-center justify-center bg-black/50">
                {unlocking && (
                  <VStack className="items-center space-y-4">
                    <Spinner size="large" color="white" />
                    <Text className="text-lg font-medium text-white">正在开锁...</Text>
                    <Text className="text-sm text-white/70">等待设备响应</Text>
                  </VStack>
                )}
                {showUnlockSuccess && (
                  <VStack className="items-center space-y-4">
                    <Box className="h-16 w-16 rounded-full bg-green-500 items-center justify-center">
                      <Icon as={Check} className="h-8 w-8 text-white" />
                    </Box>
                    <Text className="text-lg font-medium text-white">开锁成功</Text>
                  </VStack>
                )}
                {showUnlockFailed && (
                  <VStack className="items-center space-y-4">
                    <Text className="text-lg font-medium text-white mb-2">
                      开锁失败: {latestUnlockResult.message}
                    </Text>
                    <HStack className="space-x-4">
                      <Button onPress={() => setShowConfirmation(false)} className="bg-gray-600">
                        <ButtonText className="text-white px-4">返回</ButtonText>
                      </Button>
                      <Button onPress={handleUnlock}>
                        <ButtonText className="px-4">重试</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}
                {!unlocking &&
                  (!latestUnlockResult || unlockResultTimestamp <= currentOperationStartTime) && (
                    <VStack className="items-center space-y-4">
                      <Text className="text-lg font-medium text-white mb-2">
                        确认远程开锁 {selectedDevice ? getDeviceDisplayName(selectedDevice) : ''}?
                      </Text>
                      <HStack className="space-x-4">
                        <Button onPress={() => setShowConfirmation(false)} className="bg-gray-600">
                          <ButtonText className="text-white px-4">取消</ButtonText>
                        </Button>
                        <Button onPress={handleUnlock}>
                          <ButtonText className="px-4">确认</ButtonText>
                        </Button>
                      </HStack>
                    </VStack>
                  )}
              </Box>
            ) : (
              <>
                <TouchableOpacity onPress={() => showImage(selectDeviceStatus?.image || '')}>
                  <Image
                    source={{ uri: selectDeviceStatus?.image }}
                    style={{ width: '100%', height: 300, borderRadius: 4 }}
                    contentFit="fill"
                    transition={300}
                    placeholder={{ blurhash }}
                    placeholderContentFit="fill"
                    cachePolicy="memory-disk"
                  />
                </TouchableOpacity>
                <Box className="absolute bottom-4 right-4">
                  <TouchableOpacity className="h-12 w-12 rounded-full bg-white/70 items-center justify-center">
                    <Icon as={Camera} className="h-6 w-6 text-gray-800" />
                  </TouchableOpacity>
                </Box>
              </>
            )}
          </Box>
          <VStack className="p-4 bg-white">
            <Select
              selectedValue={selectedDeviceId}
              onValueChange={(value: string) => setSelectedDeviceId(value)}
            >
              <SelectTrigger>
                <SelectInput
                  placeholder="选择设备"
                  value={selectedDevice ? getDeviceDisplayName(selectedDevice) : ''}
                />
                <SelectIcon as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {devices.map(device => (
                    <SelectItem
                      key={device.id}
                      label={getDeviceDisplayName(device)}
                      value={device.id}
                      className="p-3"
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
            <HStack className="items-center justify-between mt-2 mb-4">
              {isSelectedDeviceOnline && (
                <HStack className="items-center">
                  <Icon
                    as={selectDeviceStatus?.isOpen ? DoorOpen : DoorClosed}
                    className={cn(
                      'h-4 w-4 mr-1 text-gray-500',
                      selectDeviceStatus?.isOpen ? 'text-green-500' : 'text-primary'
                    )}
                  />
                  <Text
                    className={cn(
                      'text-sm',
                      selectDeviceStatus?.isOpen ? 'text-green-500' : 'text-primary'
                    )}
                  >
                    {selectDeviceStatus?.isOpen ? '门已开启' : '门以关闭'}
                  </Text>
                </HStack>
              )}

              {getBatteryContent()}

              <HStack className="items-center">
                <Icon
                  as={isSelectedDeviceOnline ? Wifi : WifiOff}
                  className={`h-4 w-4 mr-1 ${isSelectedDeviceOnline ? 'text-green-500' : 'text-red-500'}`}
                />
                <Text
                  className={`text-sm ${isSelectedDeviceOnline ? 'text-green-500' : 'text-red-500'}`}
                >
                  {isSelectedDeviceOnline ? '设备在线' : '设备已离线'}
                </Text>
              </HStack>
            </HStack>
            {!showConfirmation && (
              <Button
                className="w-full"
                onPress={handleShowConfirmation}
                isDisabled={
                  !isSelectedDeviceOnline ||
                  status.isUnlocking ||
                  unlocking ||
                  selectDeviceStatus?.isOpen ||
                  selectDeviceStatus?.batteryLevel === 0
                }
              >
                {status.isUnlocking || unlocking ? (
                  <Spinner color="white" size="small" />
                ) : (
                  <ButtonText>{getRemoteUnlockButtonText()}</ButtonText>
                )}
              </Button>
            )}
          </VStack>
        </Box>

        <Box className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <Text className="text-sm font-medium text-yellow-800 mb-2">安全提示</Text>
          <Text className="text-xs text-yellow-700">
            远程开锁功能将通过门锁摄像头拍摄照片，并发送给您确认。请确保您认识需要进入的人员，以保障家庭安全。
          </Text>
        </Box>

        <VStack className="space-y-3 gap-2">
          <Text className="text-lg font-medium">最近访问记录</Text>

          {isLoadingRecords ? (
            // 加载状态
            <>
              <UnlockRecordItemSkeleton showExtraInfo={false} />
              <UnlockRecordItemSkeleton showExtraInfo={false} />
              <UnlockRecordItemSkeleton showExtraInfo={false} />
            </>
          ) : isErrorRecords ? (
            // 错误状态
            <Box className="p-3 border border-border rounded-lg bg-white">
              <Text className="text-sm text-red-500">加载失败，请稍后重试</Text>
            </Box>
          ) : recentRecords.length === 0 ? (
            // 空记录状态
            <Box className="p-3 border border-border rounded-lg bg-white">
              <Text className="text-sm text-gray-500">暂无访问记录</Text>
            </Box>
          ) : (
            // 显示记录列表
            recentRecords.map(record => <UnlockRecordItem key={record.id} record={record} />)
          )}
        </VStack>
      </VStack>
    </ScrollView>
  );
}
