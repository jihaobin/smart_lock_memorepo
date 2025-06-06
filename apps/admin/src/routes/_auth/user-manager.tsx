import { AdminUserItem } from '@smart-lock/shared';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { User2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { ConfigurableDataTable } from '@/components/configurable-data-table';
import apiClient, { queryHooks } from '@/lib/aip-service';
import RoleBadge from '@/components/role-badge';

export const Route = createFileRoute('/_auth/user-manager')({
  component: UserManager,
  staticData: {
    title: '用户管理',
    icon: <User2 size={16} />,
  },
  loader: async ({ context: { queryClient } }) => {
    const userData = await queryClient.fetchQuery({
      queryKey: ['users', { page: 1, pageSize: 10 }],
      queryFn: () => apiClient.getPage('/user/all'),
    });
    return userData;
  },
});

// 表格列配置
const columns: ColumnDef<AdminUserItem>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    enableResizing: true,
    // enablePinning: true,
  },
  {
    accessorKey: 'name',
    header: '名称',
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: '角色',
    enableSorting: true,
    cell: ({ row }) => row.original.roles.map(role => <RoleBadge role={role.name}></RoleBadge>),
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    enableSorting: true,
  },
];

export default function UserManager() {
  console.log('refresh');
  // 添加状态控制分页模式
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<AdminUserItem[]>([]);
  const { data: apiData, isFetching } = queryHooks.usePaginatedQuery<AdminUserItem>(
    ['users'],
    '/user/all',
    { page, pageSize },
    {
      placeholderData: keepPreviousData,
    }
  );

  useEffect(() => {
    setData(apiData?.items ?? []);
  }, [apiData]);

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
          />
        </div>
      </div>
    </div>
  );
}
