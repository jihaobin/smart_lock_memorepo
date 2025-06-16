import { ConfigurableDataTable } from '@/components/configurable-data-table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { AdminDevice, CreateDeviceInput, UpdateDeviceInput } from '@smart-lock/shared';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Smartphone, Wifi, WifiOff, Battery } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod/v4';
import { UseFormReturn } from 'react-hook-form';
import { useDeviceApi } from '@/hooks/useDeviceApi';
import { useDeviceModelApi } from '@/hooks/useDeviceModelApi';
import { useNormalUserApi } from '@/hooks/useNormalUserApi';
import { Badge } from '@/components/ui/badge';
import InfiniteSelect from '@/components/infinite-select';

// 定义表单验证schema
const deviceFormSchema = z.object({
  name: z.string().min(1, '设备名称不能为空').max(255, '设备名称不能超过255个字符'),
  modelId: z.string().min(1, '设备型号不能为空').length(5, '设备型号ID必须为5位字符'),
  ownerId: z.string().optional(),
});

// 编辑时的表单验证schema
const editDeviceFormSchema = z.object({
  name: z.string().min(1, '设备名称不能为空').max(255, '设备名称不能超过255个字符'),
  modelId: z.string().min(1, '设备型号不能为空').length(5, '设备型号ID必须为5位字符'),
  ownerId: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceFormSchema>;

export const Route = createFileRoute('/_auth/device-manager')({
  component: RouteComponent,
  staticData: {
    title: '设备管理',
    icon: <Smartphone size={16} />,
  },
  loader: async ({ context: { queryClient } }) => {
    const deviceData = await queryClient.fetchQuery({
      queryKey: ['devices', { page: 1, limit: 10 }],
      queryFn: () => apiClient.getPage('/device/all'),
    });
    return deviceData;
  },
});

function RouteComponent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<AdminDevice[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const { data: apiData, isFetching } = queryHooks.usePaginatedQuery<AdminDevice>(
    ['devices'],
    '/device/all',
    { page, limit: pageSize },
    {
      placeholderData: keepPreviousData,
    }
  );

  // 表格列配置
  const columns: ColumnDef<AdminDevice>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      enableResizing: true,
    },
    {
      accessorKey: 'name',
      header: '设备名称',
      enableSorting: true,
    },
    {
      accessorKey: 'nikeName',
      header: '设备昵称',
      enableSorting: true,
    },
    {
      accessorKey: 'model',
      header: '设备型号',
      enableSorting: true,
      cell: ({ row }) => {
        const model = row.original.deviceModel;
        console.log('model', row.original);
        return model ? model.modelName : '-';
      },
    },
    {
      accessorKey: 'owner.phone',
      header: '所有者',
      enableSorting: true,
    },
    {
      accessorKey: 'status.isOnline',
      header: '在线状态',
      enableSorting: true,
      cell: ({ row }) => {
        const isOnline = row.original.status.isOnline;
        return (
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <Badge variant="default" className="bg-green-100 text-green-800">
                  在线
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  离线
                </Badge>
              </>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'status.batteryLevel',
      header: '电量',
      enableSorting: true,
      cell: ({ row }) => {
        const batteryLevel = row.original.status.batteryLevel;
        const getBatteryColor = (level: number) => {
          if (level > 50) return 'text-green-600';
          if (level > 20) return 'text-yellow-600';
          return 'text-red-600';
        };
        return (
          <div className="flex items-center gap-2">
            <Battery className={`h-4 w-4 ${getBatteryColor(batteryLevel)}`} />
            <span className={getBatteryColor(batteryLevel)}>{batteryLevel}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status.isOpen',
      header: '门锁状态',
      enableSorting: true,
      cell: ({ row }) => {
        const isOpen = row.original.status.isOpen;
        return (
          <Badge variant={isOpen ? 'destructive' : 'default'}>{isOpen ? '已开启' : '已关闭'}</Badge>
        );
      },
    },
    {
      accessorKey: 'status.lastConnectionTime',
      header: '最后连接时间',
      cell: ({ row }) => {
        const lastConnectionTime = row.original.status.lastConnectionTime;
        return new Date(lastConnectionTime).toLocaleString('zh-CN');
      },
    },
    {
      header: '操作',
      cell: ({ row, table }) => {
        // 从table的meta中获取编辑处理函数
        const handleEdit = (table.options.meta as any)?.handleEditButtonClick;

        return (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="link"
              className="text-blue-600"
              onClick={() => handleEdit?.(row.original)}
            >
              编辑
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-red-600"
              onClick={() => {
                setDeviceToDelete(row.original.id);
                setDeleteDialogOpen(true);
              }}
            >
              删除
            </Button>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    setData(apiData?.items ?? []);
  }, [apiData]);

  const { useCreateDevice, useUpdateDevice, useDeleteDevice } = useDeviceApi();
  const { mutateAsync: createDevice } = useCreateDevice();
  const { mutateAsync: updateDevice } = useUpdateDevice();
  const { mutateAsync: deleteDevice } = useDeleteDevice();

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (deviceToDelete) {
      try {
        await deleteDevice(deviceToDelete);
        setDeleteDialogOpen(false);
        setDeviceToDelete(null);
      } catch (error) {
        console.error('删除设备失败:', error);
      }
    }
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeviceToDelete(null);
  };

  // 表单组件
  function DeviceFormComponent({
    form,
    isEdit = false,
  }: {
    form: UseFormReturn<DeviceFormData>;
    isEdit?: boolean;
  }) {
    const { useInfiniteDeviceModels } = useDeviceModelApi();
    const { useInfiniteUsers } = useNormalUserApi();

    // 获取设备型号数据
    const {
      data: deviceModelsData,
      fetchNextPage: fetchNextDeviceModels,
      hasNextPage: hasNextDeviceModels,
      isFetchingNextPage: isFetchingNextDeviceModels,
      isLoading: isLoadingDeviceModels,
    } = useInfiniteDeviceModels({
      limit: '20',
      sortBy: 'createdAt',
      sortOrder: 'asc',
    });

    // 获取用户数据
    const {
      data: usersData,
      fetchNextPage: fetchNextUsers,
      hasNextPage: hasNextUsers,
      isFetchingNextPage: isFetchingNextUsers,
      isLoading: isLoadingUsers,
    } = useInfiniteUsers({ pageSize: '20' });

    // 转换设备型号数据为选项格式
    const deviceModelOptions =
      deviceModelsData?.pages.flatMap(page =>
        page.items.map(model => ({
          value: model.id,
          label: `${model.modelName}`,
        }))
      ) || [];

    // 转换用户数据为选项格式
    const userOptions =
      usersData?.pages.flatMap(page =>
        page.items.map(user => ({
          value: user.id,
          label: `${user.phone} (${user.nikeName})`,
        }))
      ) || [];

    return (
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>设备名称</FormLabel>
                <FormControl>
                  <Input placeholder="请输入设备名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>设备型号</FormLabel>
                <FormControl>
                  <InfiniteSelect
                    options={deviceModelOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    onLoadMore={fetchNextDeviceModels}
                    hasNextPage={hasNextDeviceModels || false}
                    isLoading={isFetchingNextDeviceModels || isLoadingDeviceModels}
                    placeholder="请选择设备型号"
                  />
                </FormControl>
                <FormDescription>选择设备的型号规格</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>所有者</FormLabel>
                <FormControl>
                  <InfiniteSelect
                    options={userOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    onLoadMore={fetchNextUsers}
                    hasNextPage={hasNextUsers || false}
                    isLoading={isFetchingNextUsers || isLoadingUsers}
                    placeholder="请选择设备所有者（可选）"
                  />
                </FormControl>
                <FormDescription>选择设备的所有者，留空表示未分配</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    );
  }

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
            formDialog={{
              title: '添加设备',
              description: '创建新的设备',
              schema: deviceFormSchema,
              defaultValues: {
                name: '',
                modelId: '',
                ownerId: '',
              },
              component: form => <DeviceFormComponent form={form} isEdit={false} />,
              onSubmit: async (data: DeviceFormData) => {
                try {
                  const submitData: CreateDeviceInput = {
                    name: data.name,
                    modelId: data.modelId,
                    ownerId: data.ownerId || undefined,
                  };

                  await createDevice(submitData);
                } catch (error) {
                  throw error;
                }
              },
            }}
            editDialog={{
              title: '编辑设备',
              description: '修改设备信息',
              schema: editDeviceFormSchema,
              component: form => <DeviceFormComponent form={form} isEdit={true} />,
              transformToFormData: (rowData: AdminDevice) => {
                return {
                  name: rowData.name,
                  modelId: rowData.deviceModel?.id || '',
                  ownerId: rowData.owner?.id || '',
                };
              },
              onSubmit: async (data: DeviceFormData, originalData: AdminDevice) => {
                try {
                  const submitData: UpdateDeviceInput = {
                    name: data.name,
                    modelId: data.modelId,
                    ownerId: data.ownerId || undefined,
                  };
                  await updateDevice({
                    deviceData: submitData,
                    id: originalData.id,
                  });
                } catch (error) {
                  console.error('Failed to update device:', error);
                  throw error;
                }
              },
            }}
          />
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>您确定要删除这个设备吗？此操作无法撤销。</DialogDescription>
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
