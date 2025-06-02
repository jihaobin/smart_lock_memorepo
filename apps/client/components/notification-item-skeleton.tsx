import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { VStack } from '@/components/ui/vstack';

interface NotificationItemSkeletonProps {
  showExtraInfo?: boolean;
}

export const NotificationItemSkeleton = memo(
  ({ showExtraInfo = false }: NotificationItemSkeletonProps) => {
    return (
      <Box className="rounded-lg overflow-hidden mb-3">
        <HStack className="p-4 bg-gray-50">
          {/* 图标区域 */}
          <Skeleton className="h-10 w-10 rounded-full mr-3" />

          <VStack className="flex-1">
            <HStack className="items-end justify-between gap-2">
              {/* 通知消息 */}
              <SkeletonText className="h-5 w-3/4" />
              {/* 时间戳 */}
              <SkeletonText className="h-3 w-16" />
            </HStack>

            {/* 设备信息 */}
            <SkeletonText className="h-4 w-1/2 mt-1" />

            {/* 额外数据 */}
            {showExtraInfo && <SkeletonText className="h-3 w-32 mt-1" />}
          </VStack>
        </HStack>
      </Box>
    );
  }
);

NotificationItemSkeleton.displayName = 'NotificationItemSkeleton';
