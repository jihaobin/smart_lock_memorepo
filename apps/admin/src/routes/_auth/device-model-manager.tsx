import { ConfigurableDataTable } from '@/components/configurable-data-table';
import { Switch } from '@/components/ui/switch';
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
// import { Textarea } from '@/components/ui/textarea';
import apiClient, { queryHooks } from '@/lib/aip-service';
import {
  DeviceModel,
  CreateDeviceModelInput,
  UpdateDeviceModelInput,
  CreateDeviceModelSchema,
  UpdateDeviceModelSchema,
} from '@smart-lock/shared';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Cpu, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod/v4';
import { UseFormReturn } from 'react-hook-form';
import { useDeviceModelApi } from '@/hooks/useDeviceModelApi';

// 定义表单验证schema
const deviceModelFormSchema = z
  .object({
    modelName: z.string().min(1, '型号名称不能为空').max(255, '型号名称不能超过255个字符'),
    description: z.string().optional(),
    hasCamera: z.boolean().default(false),
    hasFingerprint: z.boolean().default(false),
    hasFace: z.boolean().default(false),
    hasEye: z.boolean().default(false),
    hasPalm: z.boolean().default(false),
    hasNFC: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    hasBluetooth: z.boolean().default(false),
    totalStock: z.number().int().min(0, '总库存不能为负数').default(0),
    remainingStock: z.number().int().min(0, '剩余库存不能为负数').default(0),
  })
  .refine(data => data.remainingStock <= data.totalStock, {
    message: '剩余库存不能大于总库存',
    path: ['remainingStock'],
  });

// 编辑时的表单验证schema（不包含库存字段，库存通过单独的调整功能管理）
const editDeviceModelFormSchema = z.object({
  modelName: z.string().min(1, '型号名称不能为空').max(255, '型号名称不能超过255个字符'),
  description: z.string().optional(),
  hasCamera: z.boolean().default(false),
  hasFingerprint: z.boolean().default(false),
  hasFace: z.boolean().default(false),
  hasEye: z.boolean().default(false),
  hasPalm: z.boolean().default(false),
  hasNFC: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasBluetooth: z.boolean().default(false),
});

type DeviceModelFormData = z.infer<typeof deviceModelFormSchema>;
type EditDeviceModelFormData = z.infer<typeof editDeviceModelFormSchema>;

export const Route = createFileRoute('/_auth/device-model-manager')({
  component: DeviceModelComponent,
  staticData: {
    title: '设备型号管理',
    icon: <Cpu size={16} />,
  },
  loader: async ({ context: { queryClient } }) => {
    const deviceModelData = await queryClient.fetchQuery({
      queryKey: ['deviceModels', { page: 1, pageSize: 10 }],
      queryFn: () => apiClient.getPage('/deviceModel'),
    });
    return deviceModelData;
  },
});

function DeviceModelComponent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<DeviceModel[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceModelToDelete, setDeviceModelToDelete] = useState<string | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState<{
    id: string;
    currentStock: number;
  } | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  const { data: apiData, isFetching } = queryHooks.usePaginatedQuery<DeviceModel>(
    ['deviceModels'],
    '/deviceModel',
    { page, pageSize },
    {
      placeholderData: keepPreviousData,
    }
  );

  // 表格列配置
  const columns: ColumnDef<DeviceModel>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      enableResizing: true,
    },
    {
      accessorKey: 'modelName',
      header: '型号名称',
      enableSorting: true,
    },
    {
      accessorKey: 'description',
      header: '描述',
      enableSorting: true,
      cell: ({ row }) => row.original.description || '-',
    },
    {
      accessorKey: 'hasCamera',
      header: '摄像头',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasCamera} />,
    },
    {
      accessorKey: 'hasFingerprint',
      header: '指纹',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasFingerprint} />,
    },
    {
      accessorKey: 'hasFace',
      header: '人脸',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasFace} />,
    },
    {
      accessorKey: 'hasEye',
      header: '虹膜',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasEye} />,
    },
    {
      accessorKey: 'hasPalm',
      header: '掌纹',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasPalm} />,
    },
    {
      accessorKey: 'hasNFC',
      header: 'NFC',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasNFC} />,
    },
    {
      accessorKey: 'hasWifi',
      header: 'WiFi',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasWifi} />,
    },
    {
      accessorKey: 'hasBluetooth',
      header: '蓝牙',
      enableSorting: true,
      cell: ({ row }) => <Switch checked={row.original.hasBluetooth} />,
    },
    // {
    //   header: '功能特性',
    //   cell: ({ row }) => {
    //     const features = [];
    //     if (row.original.hasCamera) features.push('摄像头');
    //     if (row.original.hasFingerprint) features.push('指纹');
    //     if (row.original.hasFace) features.push('人脸');
    //     if (row.original.hasEye) features.push('虹膜');
    //     if (row.original.hasPalm) features.push('掌纹');
    //     if (row.original.hasNFC) features.push('NFC');
    //     if (row.original.hasWifi) features.push('WiFi');
    //     if (row.original.hasBluetooth) features.push('蓝牙');
    //     return features.length > 0 ? features.join(', ') : '-';
    //   },
    // },
    {
      accessorKey: 'totalStock',
      header: '总库存',
      enableSorting: true,
    },
    {
      accessorKey: 'remainingStock',
      header: '剩余库存',
      enableSorting: true,
      cell: ({ row }) => {
        const remaining = row.original.remainingStock;
        const total = row.original.totalStock;
        const percentage = total > 0 ? (remaining / total) * 100 : 0;
        const colorClass =
          percentage > 50 ? 'text-green-600' : percentage > 20 ? 'text-yellow-600' : 'text-red-600';
        return <span className={colorClass}>{remaining}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      enableSorting: true,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleString('zh-CN');
      },
    },
    {
      header: '操作',
      cell: ({ row, table }) => {
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
              className="text-green-600"
              onClick={() => {
                setStockAdjustment({
                  id: row.original.id,
                  currentStock: row.original.remainingStock,
                });
                setStockDialogOpen(true);
              }}
            >
              调整库存
            </Button>
            <Button
              type="button"
              variant="link"
              className="text-red-600"
              onClick={() => {
                setDeviceModelToDelete(row.original.id);
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

  const { useCreateDeviceModel, useUpdateDeviceModel, useDeleteDeviceModel, useAdjustStock } =
    useDeviceModelApi();
  const { mutateAsync: createDeviceModel } = useCreateDeviceModel();
  const { mutateAsync: updateDeviceModel } = useUpdateDeviceModel();
  const { mutateAsync: deleteDeviceModel } = useDeleteDeviceModel();
  const { mutateAsync: adjustStock } = useAdjustStock();

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (deviceModelToDelete) {
      try {
        await deleteDeviceModel(deviceModelToDelete);
        setDeleteDialogOpen(false);
        setDeviceModelToDelete(null);
      } catch (error) {
        console.error('删除设备型号失败:', error);
      }
    }
  };

  // 取消删除
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeviceModelToDelete(null);
  };

  // 处理库存调整
  const handleStockAdjustment = async () => {
    if (stockAdjustment && adjustmentValue !== 0) {
      try {
        await adjustStock({ id: stockAdjustment.id, adjustment: adjustmentValue });
        setStockDialogOpen(false);
        setStockAdjustment(null);
        setAdjustmentValue(0);
      } catch (error) {
        console.error('调整库存失败:', error);
      }
    }
  };

  // 表单组件
  function DeviceModelFormComponent({
    form,
    isEdit = false,
  }: {
    form: UseFormReturn<DeviceModelFormData | EditDeviceModelFormData>;
    isEdit?: boolean;
  }) {
    return (
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="modelName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>型号名称</FormLabel>
                <FormControl>
                  <Input placeholder="请输入设备型号名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>描述</FormLabel>
                <FormControl>
                  <Input placeholder="请输入设备型号描述（可选）" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hasCamera"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">摄像头</FormLabel>
                    <FormDescription className="text-xs">是否支持摄像头功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasFingerprint"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">指纹识别</FormLabel>
                    <FormDescription className="text-xs">是否支持指纹识别功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasFace"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">人脸识别</FormLabel>
                    <FormDescription className="text-xs">是否支持人脸识别功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasEye"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">虹膜识别</FormLabel>
                    <FormDescription className="text-xs">是否支持虹膜识别功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasPalm"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">掌纹识别</FormLabel>
                    <FormDescription className="text-xs">是否支持掌纹识别功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasNFC"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">NFC</FormLabel>
                    <FormDescription className="text-xs">是否支持NFC功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasWifi"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">WiFi</FormLabel>
                    <FormDescription className="text-xs">是否支持WiFi功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasBluetooth"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">蓝牙</FormLabel>
                    <FormDescription className="text-xs">是否支持蓝牙功能</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {!isEdit && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>总库存</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="请输入总库存数量"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remainingStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>剩余库存</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="请输入剩余库存数量"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
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
              title: '添加设备型号',
              description: '创建新的设备型号',
              schema: deviceModelFormSchema,
              defaultValues: {
                modelName: '',
                description: '',
                hasCamera: false,
                hasFingerprint: false,
                hasFace: false,
                hasEye: false,
                hasPalm: false,
                hasNFC: false,
                hasWifi: false,
                hasBluetooth: false,
                totalStock: 0,
                remainingStock: 0,
              },
              component: form => <DeviceModelFormComponent form={form} isEdit={false} />,
              onSubmit: async (data: DeviceModelFormData) => {
                try {
                  await createDeviceModel(data);
                } catch (error) {
                  throw error;
                }
              },
            }}
            editDialog={{
              title: '编辑设备型号',
              description: '修改设备型号信息',
              schema: editDeviceModelFormSchema,
              component: form => <DeviceModelFormComponent form={form} isEdit={true} />,
              transformToFormData: (rowData: DeviceModel) => {
                return {
                  modelName: rowData.modelName,
                  description: rowData.description || '',
                  hasCamera: rowData.hasCamera,
                  hasFingerprint: rowData.hasFingerprint,
                  hasFace: rowData.hasFace,
                  hasEye: rowData.hasEye,
                  hasPalm: rowData.hasPalm,
                  hasNFC: rowData.hasNFC,
                  hasWifi: rowData.hasWifi,
                  hasBluetooth: rowData.hasBluetooth,
                };
              },
              onSubmit: async (data: EditDeviceModelFormData, originalData: DeviceModel) => {
                try {
                  await updateDeviceModel({
                    id: originalData.id,
                    deviceModelData: {
                      id: originalData.id,
                      ...data,
                    },
                  });
                } catch (error) {
                  console.error('Failed to update device model:', error);
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
            <DialogDescription>您确定要删除这个设备型号吗？此操作无法撤销。</DialogDescription>
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

      {/* 库存调整弹窗 */}
      <Dialog open={stockDialogOpen} onOpenChange={setStockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>调整库存</DialogTitle>
            <DialogDescription>当前剩余库存：{stockAdjustment?.currentStock} 件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAdjustmentValue(prev => prev - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                value={adjustmentValue}
                onChange={e => setAdjustmentValue(parseInt(e.target.value) || 0)}
                className="text-center"
                placeholder="调整数量"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAdjustmentValue(prev => prev + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              调整后库存：{(stockAdjustment?.currentStock || 0) + adjustmentValue} 件
              {adjustmentValue > 0 && <span className="text-green-600"> (+{adjustmentValue})</span>}
              {adjustmentValue < 0 && <span className="text-red-600"> ({adjustmentValue})</span>}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStockDialogOpen(false);
                setStockAdjustment(null);
                setAdjustmentValue(0);
              }}
            >
              取消
            </Button>
            <Button onClick={handleStockAdjustment} disabled={adjustmentValue === 0}>
              确认调整
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
