import { UserItem, GetAllUsersType, GetAllUsersResponse } from '@smart-lock/shared';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { ConfigurableDataTable } from '@/components/configurable-data-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import apiClient, { queryHooks } from '@/lib/aip-service';
import { useNormalUserApi } from '@/hooks/useNormalUserApi';

export const Route = createFileRoute('/_auth/user-manager')({
  component: UserManager,
  staticData: {
    title: '用户管理',
    icon: <Users size={16} />,
  },
  loader: async ({ context: { queryClient } }) => {
    const userData = await queryClient.fetchQuery({
      queryKey: ['normalUsers', { page: 1, pageSize: 10 }],
      queryFn: () => apiClient.getPage('/user/all'),
    });
    return userData;
  },
});

function UserComponent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<UserItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { data: apiData, isFetching } = queryHooks.usePaginatedQuery<UserItem>(
    ['normalUsers'],
    '/user/all',
    { page, pageSize },
    {
      placeholderData: keepPreviousData,
    }
  );

  // 表格列配置
  const columns: ColumnDef<UserItem>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      enableResizing: true,
    },
    {
      accessorKey: 'phone',
      header: '手机号',
      enableSorting: true,
    },
    {
      accessorKey: 'nikeName',
      header: '昵称',
      enableSorting: true,
      cell: ({ row }) => row.original.nikeName || '-',
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      enableSorting: true,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt ?? '');
        return date.toLocaleString('zh-CN');
      },
    },
    {
      accessorKey: 'updatedAt',
      header: '更新时间',
      enableSorting: true,
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt ?? '');
        return date.toLocaleString('zh-CN');
      },
    },
  ];

  useEffect(() => {
    setData(apiData?.items ?? []);
  }, [apiData]);

  const { useUsers } = useNormalUserApi();

  // 处理删除确认（暂时不实现删除功能，因为后端没有提供删除接口）
  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        // 这里可以添加删除逻辑，当后端提供删除接口时
        console.log('删除用户:', userToDelete);
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      } catch (error) {
        console.error('删除用户失败:', error);
      }
    }
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <ConfigurableDataTable
            serverSidePagination={true}
            enableRowSelection={false}
            data={data}
            columns={columns}
            loading={isFetching}
            pagination={{
              defaultPageSize: 10,
              pageSizeOptions: [10, 20, 40, 60],
              rowCount: apiData?.meta.total,
              onPaginationChange: (pageIndex, pageSize) => {
                setPage(pageIndex + 1);
                setPageSize(pageSize);
              },
            }}
            onDragSortEnd={newData => {
              setData(newData);
            }}
            // 暂时不提供添加和编辑功能，因为这是普通用户管理，通常不允许管理员直接创建普通用户
          />
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>您确定要删除这个用户吗？此操作无法撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDeleteCancel}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserManager() {
  return <UserComponent />;
}

export default UserManager;
