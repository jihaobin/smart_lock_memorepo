import { memo } from 'react';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
import { VStack } from '@/components/ui/vstack';

interface UnlockRecordItemSkeletonProps {
  showExtraInfo?: boolean;
}

export const UnlockRecordItemSkeleton = memo(
  ({ showExtraInfo = false }: UnlockRecordItemSkeletonProps) => {
    return (
      <Box className="rounded-lg p-3 mb-2 bg-gray-50 border border-gray-100">
        <HStack className="items-center">
          {/* 图标区域 */}
          <Skeleton className="h-10 w-10 rounded-full" />

          <VStack className="flex-1 ml-3">
            <HStack className="items-center justify-between">
              {/* 用户名 */}
              <SkeletonText className="h-5 w-32" />
              {/* 时间 */}
              <SkeletonText className="h-4 w-12" />
            </HStack>

            <HStack className="items-center mt-1 justify-between gap-2">
              <HStack className="items-center space-x-2 gap-2">
                {/* 解锁方式 */}
                <SkeletonText className="h-4 w-20" />
                {/* 访问类型 */}
                <SkeletonText className="h-3 w-16" />
              </HStack>
              {/* 日期 */}
              <SkeletonText className="h-3 w-24" />
            </HStack>

            {/* 额外信息 */}
            {showExtraInfo && (
              <VStack className="mt-1 space-y-1">
                <SkeletonText className="h-3 w-36" />
                <SkeletonText className="h-3 w-24" />
              </VStack>
            )}
          </VStack>
        </HStack>
      </Box>
    );
  }
);

UnlockRecordItemSkeleton.displayName = 'UnlockRecordItemSkeleton';
