import { FlashList } from '@shopify/flash-list';
import { DeviceUnlockRecordOpenType } from '@smart-lock/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useLocalSearchParams } from 'expo-router';
import { Calendar, Search, Key, Info, ChevronDown } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import { ScrollView, Pressable, RefreshControl } from 'react-native';
import 'dayjs/locale/zh-cn';
import DatePicker, { DateType, useDefaultClassNames } from 'react-native-ui-datepicker';

import { ModalBase } from '@/components/ModalBase';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/menu';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { UnlockRecordItem, unlockMethodDetails } from '@/components/unlock-record-item';
import { UnlockRecordItemSkeleton } from '@/components/unlock-record-item-skeleton';
import { useDevices } from '@/hooks/useDevices';
import { cn } from '@/lib/utils';
import { UnlockRecord, useUnlockRecordService } from '@/services/unlockRecord';

// 定义扁平化后的数据项类型，解决any类型问题
type FlattenedDataItem =
  | UnlockRecord
  | {
      id: string;
      title: string;
      isTitle: true;
    };

// 配置dayjs
dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function AccessLogs() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const { devices } = useDevices();

  const [deviceName] = useState(devices.find(device => device.id === id)?.name || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccessMethods, setSelectedAccessMethods] = useState<DeviceUnlockRecordOpenType[]>(
    []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<{
    startDate: DateType;
    endDate: DateType;
  }>({
    startDate: undefined,
    endDate: undefined,
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const unlockRecordService = useUnlockRecordService();

  // 使用useInfiniteQuery获取解锁记录列表
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['unlockRecords', id, selectedAccessMethods, dateRange],
      queryFn: async ({ pageParam = 1 }) => {
        const params: Record<string, string | number> = {
          deviceId: id,
          page: pageParam,
          pageSize: 10,
        };

        // 添加开锁类型过滤条件
        if (selectedAccessMethods.length > 0) {
          // 注意：后端API可能不支持多值查询，可能需要在前端过滤
          params.unlockType = selectedAccessMethods[0];
        }

        // 添加日期范围过滤条件
        if (dateRange.startDate) {
          params.startTime = dayjs(dateRange.startDate).startOf('day').toISOString();
        }
        if (dateRange.endDate) {
          params.endTime = dayjs(dateRange.endDate).endOf('day').toISOString();
        }

        const response = await unlockRecordService.getUnlockRecords(params);
        return response;
      },
      getNextPageParam: lastPage => {
        const totalPages = Math.ceil(lastPage.total / lastPage.limit);
        return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
      },
      initialPageParam: 1,
    });

  // 处理下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // 处理上拉加载更多
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // 获取所有记录数据
  const unlockRecords = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.items);
  }, [data?.pages]);

  // 按用户名筛选记录
  const filteredRecords = useMemo(() => {
    if (!unlockRecords.length) return [];

    if (!searchQuery) return unlockRecords;

    // 按用户名筛选
    return unlockRecords.filter(record =>
      record.unlockData?.friendName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unlockRecords, searchQuery]);

  // 按日期分组记录
  const groupedRecords = useMemo(() => {
    if (filteredRecords.length === 0) return [];

    const groups = new Map<string, UnlockRecord[]>();

    filteredRecords.forEach(record => {
      const date = new Date(record.timestamp);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!groups.has(dateStr)) {
        groups.set(dateStr, []);
      }

      groups.get(dateStr)?.push(record);
    });

    return Array.from(groups.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([dateStr, items]) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const formattedDate = `${year}年${month}月${day}日`;

        return {
          date: dateStr,
          title: formattedDate,
          data: items,
        };
      });
  }, [filteredRecords]);

  // 将分组数据转换为扁平列表
  const flattenedData = useMemo(() => {
    if (groupedRecords.length === 0) return [];

    const flattened: FlattenedDataItem[] = [];

    groupedRecords.forEach(group => {
      // 添加日期标题
      flattened.push({
        id: `date-${group.date}`,
        title: group.title,
        isTitle: true,
      });

      // 添加该日期下的所有记录
      group.data.forEach(record => {
        flattened.push(record);
      });
    });

    return flattened;
  }, [groupedRecords]);

  // 清除所有筛选条件
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedAccessMethods([]);
    setDateRange({
      startDate: undefined,
      endDate: undefined,
    });
  }, []);

  const defaultClassNames = useDefaultClassNames();
  // 日期选择器自定义样式
  const customClassNames = {
    ...defaultClassNames,
    today: 'border-red-500',
    today_label: 'text-red-500 font-semibold',
    selected: 'bg-red-500 border-red-500',
    selected_label: 'text-white font-semibold',
    day: `${defaultClassNames.day} hover:bg-red-100`,
    // 添加日期范围相关的样式
    range_start: 'bg-red-500 border-red-500',
    range_start_label: 'text-white font-semibold',
    range_end: 'bg-red-500 border-red-500',
    range_end_label: 'text-white font-semibold',
    range_fill: 'bg-red-100',
    inRange_label: 'text-gray-800',
    monthHeaderButton: 'text-red-500',
  };

  // 渲染记录项
  const renderRecordItem = useCallback(({ item }: { item: FlattenedDataItem }) => {
    // 如果是日期标题项
    if ('isTitle' in item && item.isTitle) {
      return (
        <Box className="py-3 px-2 mt-2 mb-1 border-b border-gray-100">
          <Text className="text-sm font-bold text-gray-700">{item.title}</Text>
        </Box>
      );
    }

    // 如果是解锁记录项，使用新组件
    return <UnlockRecordItem record={item as UnlockRecord} />;
  }, []);

  // 渲染底部加载更多指示器
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <Box className="items-center py-4">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Text className="text-sm text-gray-500 mt-2">加载更多...</Text>
      </Box>
    );
  }, [isFetchingNextPage]);

  // 渲染骨架屏加载状态
  const renderLoading = useCallback(() => {
    return (
      <VStack className="space-y-2">
        {/* 日期标题骨架屏 */}
        <Box className="py-3 px-2 mt-2 mb-1 border-b border-gray-100">
          <SkeletonText className="h-4 w-32" />
        </Box>

        {/* 解锁记录骨架屏 */}
        {[...Array(3)].map((_, index) => (
          <UnlockRecordItemSkeleton
            key={`skeleton-${index}`}
            showExtraInfo={index === 0} // 只在第一个项目显示额外信息
          />
        ))}

        {/* 另一个日期标题骨架屏 */}
        <Box className="py-3 px-2 mt-2 mb-1 border-b border-gray-100">
          <SkeletonText className="h-4 w-32" />
        </Box>

        {/* 更多解锁记录骨架屏 */}
        {[...Array(2)].map((_, index) => (
          <UnlockRecordItemSkeleton key={`skeleton-${index + 3}`} showExtraInfo={false} />
        ))}
      </VStack>
    );
  }, []);

  // 渲染空状态
  const renderEmpty = useCallback(() => {
    if (isError) {
      return (
        <Box className="items-center justify-center py-20">
          <Text className="text-sm text-red-500">加载失败，请下拉刷新重试</Text>
        </Box>
      );
    }

    return (
      <Box className="items-center justify-center py-20">
        <Text className="text-sm text-gray-500">暂无访问记录</Text>
      </Box>
    );
  }, [isError]);

  // 开门方式数据，从unlockMethodDetails中获取
  const accessMethodsData = Object.entries(unlockMethodDetails).map(([id, details]) => ({
    id: id as DeviceUnlockRecordOpenType,
    label: details.label,
    icon: details.icon,
    color: details.textColor,
  }));

  return (
    <Box className="flex-1 bg-gray-50">
      {/* 头部 */}
      <Box className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <HStack space="md" className="items-center">
          <Text className="text-lg font-semibold text-gray-800">{deviceName}</Text>
        </HStack>
      </Box>

      {/* 筛选器 */}
      <Box className="px-4 py-3 bg-white">
        <Box className="mb-4">
          <Input>
            <InputField
              placeholder="搜索用户..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="bg-white border border-gray-200 rounded-lg"
            />
          </Input>
        </Box>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-3">
          <HStack className="space-x-2 gap-2">
            {/* 日期范围筛选 */}
            <Box>
              <Pressable
                onPress={() => setShowCalendar(!showCalendar)}
                className={cn(
                  'flex-row items-center justify-between border border-gray-200 rounded-md p-2 bg-white w-36 h-10 shadow',
                  dateRange.startDate && dateRange.endDate && 'bg-red-50 border-red-500'
                )}
              >
                <HStack space="sm" className="items-center">
                  <Icon
                    as={Calendar}
                    className={cn(
                      'h-4 w-4 mr-1',
                      dateRange.startDate && dateRange.endDate ? 'text-red-500' : 'text-gray-500'
                    )}
                  />
                  <Text
                    className={cn(
                      'text-sm',
                      dateRange.startDate && dateRange.endDate ? 'text-red-500' : 'text-gray-500'
                    )}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {dateRange.startDate && dateRange.endDate
                      ? `${dayjs(dateRange.startDate).format('MM/DD')} - ${dayjs(dateRange.endDate).format('MM/DD')}`
                      : '日期范围'}
                  </Text>
                </HStack>
              </Pressable>

              <ModalBase
                isOpen={showCalendar}
                onClose={() => setShowCalendar(false)}
                title="选择日期范围"
                footer={
                  <HStack className="justify-between p-3 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => {
                        setDateRange({ startDate: undefined, endDate: undefined });
                        setShowCalendar(false);
                      }}
                      className="px-6"
                    >
                      <Text>清除</Text>
                    </Button>
                    <Button
                      size="sm"
                      onPress={() => setShowCalendar(false)}
                      className="px-6 bg-red-600"
                    >
                      <Text className="text-white">应用</Text>
                    </Button>
                  </HStack>
                }
              >
                <DatePicker
                  mode="range"
                  locale="zh"
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={({
                    startDate,
                    endDate,
                  }: {
                    startDate?: DateType;
                    endDate?: DateType;
                  }) => {
                    setDateRange({
                      startDate,
                      endDate,
                    });
                  }}
                  classNames={customClassNames}
                  style={{
                    marginHorizontal: 0,
                    marginVertical: 0,
                    borderRadius: 8,
                    borderWidth: 0,
                  }}
                />
              </ModalBase>
            </Box>

            {/* 开门方式筛选 */}
            <Menu
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              trigger={(triggerProps: any) => {
                return (
                  <Pressable
                    {...triggerProps}
                    className={cn(
                      'flex-row items-center justify-between border border-gray-200 rounded-md p-2 bg-white w-32 h-10 shadow',
                      selectedAccessMethods.length > 0 && 'bg-red-50 border-red-500'
                    )}
                  >
                    <HStack space="sm" className="items-center">
                      <Icon
                        as={Key}
                        className={cn(
                          'h-4 w-4 mr-1',
                          selectedAccessMethods.length > 0 ? 'text-red-500' : 'text-gray-500'
                        )}
                      />
                      <Text
                        className={cn(
                          'text-sm',
                          selectedAccessMethods.length > 0 ? 'text-red-500' : 'text-gray-500'
                        )}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {selectedAccessMethods.length > 0
                          ? `已选${selectedAccessMethods.length}项`
                          : '开门方式'}
                      </Text>
                      <Icon
                        as={ChevronDown}
                        className={cn(
                          'h-4 w-4',
                          selectedAccessMethods.length > 0 ? 'text-red-500' : 'text-gray-500'
                        )}
                      />
                    </HStack>
                  </Pressable>
                );
              }}
              placement="bottom right"
              closeOnSelect={false}
              className="shadow"
              useRNModal={true}
            >
              <MenuItem className="p-1" textValue="all">
                <VStack space="xs" className="w-full">
                  {accessMethodsData.map(method => {
                    const MethodIcon = method.icon;
                    return (
                      <Pressable
                        key={method.id}
                        className={`w-full p-3 border-b border-gray-100 flex-row items-center justify-between ${
                          selectedAccessMethods.includes(method.id) ? 'bg-red-50' : ''
                        }`}
                        onPress={() => {
                          if (selectedAccessMethods.includes(method.id)) {
                            setSelectedAccessMethods(
                              selectedAccessMethods.filter(m => m !== method.id)
                            );
                          } else {
                            setSelectedAccessMethods([...selectedAccessMethods, method.id]);
                          }
                        }}
                      >
                        <HStack className="items-center justify-between">
                          <HStack space="md" className="items-center">
                            <Icon as={MethodIcon} size="sm" className={method.color} />
                            <Text className="text-sm">{method.label}</Text>
                          </HStack>
                          {/* {selectedAccessMethods.includes(method.id) && (
                            <Box className="w-4 h-4 rounded-full bg-red-500"></Box>
                          )} */}
                        </HStack>
                      </Pressable>
                    );
                  })}
                </VStack>
              </MenuItem>
              <MenuSeparator />
              <MenuItem textValue="清除选择">
                <Pressable
                  className="p-3 flex w-full"
                  onPress={() => {
                    setSelectedAccessMethods([]);
                  }}
                >
                  <Text className="text-sm text-gray-500">清除选择</Text>
                </Pressable>
              </MenuItem>
            </Menu>

            {/* 清除筛选 */}
            {(searchQuery ||
              selectedAccessMethods.length > 0 ||
              (dateRange.startDate && dateRange.endDate)) && (
              <Pressable
                onPress={clearFilters}
                className="flex-row items-center justify-center border border-gray-200 rounded-md p-2 bg-white h-10"
              >
                <Text className="text-red-500 text-sm">清除筛选</Text>
              </Pressable>
            )}
          </HStack>
        </ScrollView>
      </Box>

      {/* 访问记录列表 */}
      <Box className="flex-1 px-4 py-4">
        {isLoading ? (
          // 加载状态下显示骨架屏
          renderLoading()
        ) : (
          // @ts-ignore - 暂时忽略FlashList类型错误
          <FlashList
            data={flattenedData}
            renderItem={renderRecordItem}
            estimatedItemSize={120}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}
      </Box>

      {/* 附加信息 */}
      <Box className="bg-blue-50 rounded-lg p-4 border border-blue-100 m-4 mb-6">
        <Text className="font-medium mb-2 text-blue-700">
          <HStack className="items-center">
            <Icon as={Info} className="h-4 w-4 mr-2 text-blue-700" />
            <Text className="text-blue-700">访问记录说明</Text>
          </HStack>
        </Text>
        <Text className="text-blue-600 text-xs">
          此页面显示了该设备的访问记录，包括访问者、时间和访问方式。您可以使用筛选功能查找特定的记录。
        </Text>
      </Box>
    </Box>
  );
}
