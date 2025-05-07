import { FlashList } from '@shopify/flash-list';
import { NotiFIcationListItem } from '@smart-lock/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';

import { NotificationItem } from '@/components/notification-item';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useNotificationService } from '@/services/notification';

export default function Notifications() {
  const [refreshing, setRefreshing] = useState(false);
  const notificationService = useNotificationService();

  // 使用useInfiniteQuery获取通知列表数据
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, refetch } =
    useInfiniteQuery({
      queryKey: ['notifications'],
      queryFn: async ({ pageParam = '' }) => {
        const response = await notificationService.getNotifications({
          page: pageParam as string,
          limit: '10',
        });
        return response;
      },
      getNextPageParam: lastPage => {
        const { page, totalPages } = lastPage.meta;
        return page < totalPages ? page + 1 : undefined;
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

  // 获取所有通知数据
  const notifications = data?.pages.flatMap(page => page.items) || [];

  // 按日期分组通知数据
  const groupedNotifications = useMemo(() => {
    // 如果没有通知数据，返回空数组
    if (notifications.length === 0) return [];

    // 创建一个Map来存储分组数据，键为日期字符串（YYYY-MM-DD），值为该日期下的通知数组
    const groups = new Map<string, NotiFIcationListItem[]>();

    // 遍历所有通知，按日期分组
    notifications.forEach(notification => {
      const date = new Date(notification.timestamp);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      if (!groups.has(dateStr)) {
        groups.set(dateStr, []);
      }

      groups.get(dateStr)?.push(notification);
    });

    // 将Map转换为数组，并按日期降序排序（最新的日期在前面）
    const sortedGroups = Array.from(groups.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([dateStr, items]) => {
        // 格式化日期显示
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

    return sortedGroups;
  }, [notifications]);

  // 渲染通知项
  const renderNotificationItem = ({ item }: { item: any }) => {
    // 如果是日期标题项
    if (item.isTitle) {
      return (
        <Box className="py-3 px-2 mt-2 mb-1 border-b border-gray-100">
          <Text className="text-sm font-bold text-gray-700">{item.title}</Text>
        </Box>
      );
    }

    // 如果是通知项
    return <NotificationItem key={item.id} notification={item} />;
  };

  // 将分组数据转换为扁平列表，用于FlashList渲染
  const flattenedData = useMemo(() => {
    if (groupedNotifications.length === 0) return [];

    // 创建一个扁平数组，包含日期标题和通知项
    const flattened: any[] = [];

    groupedNotifications.forEach(group => {
      // 添加日期标题
      flattened.push({
        id: `date-${group.date}`,
        title: group.title,
        isTitle: true,
      });

      // 添加该日期下的所有通知
      group.data.forEach(notification => {
        flattened.push(notification);
      });
    });

    return flattened;
  }, [groupedNotifications]);

  // 渲染底部加载更多指示器
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <Box className="items-center py-4">
        <ActivityIndicator size="small" color="#0000ff" />
      </Box>
    );
  };

  // 渲染空状态
  const renderEmpty = () => {
    if (isLoading) {
      return (
        <Box className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-sm text-gray-500 mt-4">加载中...</Text>
        </Box>
      );
    }

    if (isError) {
      return (
        <Box className="items-center justify-center py-20">
          <Text className="text-sm text-red-500">加载失败，请下拉刷新重试</Text>
        </Box>
      );
    }

    return (
      <Box className="items-center justify-center py-20">
        <Text className="text-sm text-gray-500">暂无通知</Text>
      </Box>
    );
  };

  return (
    <Box className="flex-1 bg-white">
      <VStack className="px-4 py-4 flex-1">
        {/* 通知标题 */}
        <HStack className="items-center justify-between mb-4">
          <Text className="text-lg font-bold mr-2">通知</Text>
        </HStack>

        {/* 通知列表 */}
        <Box className="flex-1">
          <FlashList
            data={flattenedData.length > 0 ? flattenedData : notifications}
            renderItem={renderNotificationItem}
            estimatedItemSize={100}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </Box>

        {/* 底部提示 */}
        {!isLoading && !isError && notifications.length > 0 && !hasNextPage && (
          <Box className="items-center py-4 mt-2">
            <Text className="text-sm text-gray-500">没有更多通知</Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
