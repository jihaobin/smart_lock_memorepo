import { ConfigurableDataTable } from '@/components/configurable-data-table';
import RoleBadge from '@/components/role-badge';
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
import apiClient, { queryHooks } from '@/lib/aip-service';
import { RouteItem } from '@smart-lock/shared';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Route as RouteIcon, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import Select from 'react-select';
import { useRbacApi } from '@/hooks/useRbacApi';

// 定义表单验证schema
const routeFormSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称不能超过50个字符'),
  path: z.string().min(1, '路径不能为空'),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  role: z.array(z.string()).min(1, '至少选择一个角色'),
  isEnabled: z.boolean().default(true),
});

// 编辑时的表单验证schema（不包含path字段）
const editRouteFormSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50, '名称不能超过50个字符'),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  role: z.array(z.string()).min(1, '至少选择一个角色'),
  isEnabled: z.boolean().default(true),
});

type RouteFormData = z.infer<typeof routeFormSchema>;
type EditRouteFormData = z.infer<typeof editRouteFormSchema>;

export const Route = createFileRoute('/_auth/router-manager')({
  component: RouteComponent,
  staticData: {
    title: '路由管理',
    icon: <RouteIcon size={16} />,
  },
  loader: async ({ context: { queryClient } }) => {
    const userData = await queryClient.fetchQuery({
      queryKey: ['routes', { page: 1, pageSize: 10 }],
      queryFn: () => apiClient.getPage('/rbac/routes'),
    });
    return userData;
  },
});

function RouteComponent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<RouteItem[]>([]);
  const { data: apiData, isFetching } = queryHooks.usePaginatedQuery<RouteItem>(
    ['routes'],
    '/rbac/routes',
    { page, pageSize },
    {
      placeholderData: keepPreviousData,
    }
  );

  // 表格列配置
  const columns: ColumnDef<RouteItem>[] = [
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
      accessorKey: 'path',
      header: '路径',
      enableSorting: true,
    },
    {
      accessorKey: 'parentId',
      header: '父路由',
      enableSorting: true,
      cell: ({ row }) => {
        const parentRoute = data.find(route => route.id === row.original.parentId);
        return parentRoute ? parentRoute.name : '-';
      },
    },
    {
      accessorKey: 'icon',
      header: '图标',
      enableSorting: true,
    },
    {
      accessorKey: 'role',
      header: '角色',
      enableSorting: true,
      cell: ({ row }) => row.original.role.map(role => <RoleBadge role={role}></RoleBadge>),
    },
    {
      accessorKey: 'isHidden',
      header: '是否启用',
      enableSorting: true,
      cell: ({ row }) => {
        const isEnabled = !row.original.isHidden; // hidden为true表示禁用，所以取反
        return <Switch checked={isEnabled}></Switch>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
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
            <Button type="button" variant="link" className="text-red-600">
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

  const { useRoles, useCreateRoute } = useRbacApi();
  const role = useRoles();
  const { isPending, mutateAsync: createRoute } = useCreateRoute();

  // 表单组件
  function RouteFormComponent({
    form,
    isEdit = false,
  }: {
    form: UseFormReturn<RouteFormData>;
    isEdit?: boolean;
  }) {
    return (
      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名称</FormLabel>
                <FormControl>
                  <Input placeholder="请输入路由名称" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isEdit && (
            <FormField
              control={form.control}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>路由路径</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入路由路径，如：/dashboard" {...field} />
                  </FormControl>
                  <FormDescription>路径必须以 / 开头，如：/dashboard、/users</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>父路由</FormLabel>
                <FormControl>
                  <Select
                    isClearable
                    options={data
                      .filter(route => route.name !== form.getValues('name')) // 排除自己
                      .map(route => ({
                        value: route.id,
                        label: route.name,
                      }))}
                    value={
                      data
                        .map(route => ({ value: route.id, label: route.name }))
                        .find(option => option.value === field.value) || null
                    }
                    onChange={selectedOption => {
                      field.onChange(selectedOption?.value || '');
                    }}
                    placeholder="请选择父路由（可选）"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </FormControl>
                <FormDescription>选择父路由可以创建层级结构，留空表示顶级路由</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>图标</FormLabel>
                <FormControl>
                  <Input placeholder="请输入图标名称" {...field} />
                </FormControl>
                <FormDescription className="flex items-center gap-1">
                  <span>可在</span>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => window.open('https://lucide.dev/icons/', '_blank')}
                  >
                    lucide.dev
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                  <span>查找图标名称</span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色</FormLabel>
                <FormControl>
                  <Select
                    isMulti
                    options={(role.data ?? []).map(item => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    value={(role.data ?? [])
                      .map(item => ({ value: item.id, label: item.name }))
                      .filter(option => field.value?.includes(option.value))}
                    onChange={selectedOptions => {
                      field.onChange(selectedOptions.map(option => option.value));
                    }}
                    placeholder="请选择角色"
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">是否启用</FormLabel>
                  <FormDescription>启用后该路由将在系统中可见</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
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
              title: '添加路由',
              description: '创建新的路由项',
              schema: routeFormSchema,
              defaultValues: {
                name: '',
                path: '',
                icon: '',
                parentId: '',
                role: [],
                isEnabled: true,
              },
              component: form => <RouteFormComponent form={form} isEdit={false} />,
              onSubmit: async (data: RouteFormData) => {
                try {
                  // 转换数据格式：isEnabled -> isHidden
                  const submitData = {
                    name: data.name,
                    path: data.path,
                    icon: data.icon || null,
                    parentId: data.parentId || null,
                    role: data.role,
                    isHidden: !data.isEnabled, // 注意：这里需要取反
                  };

                  // 调用API创建路由
                  await createRoute({
                    ...submitData,
                    parentId: submitData.parentId || undefined, // 将 null 转换为 undefined 以匹配 CreateRouteDto 类型
                    icon: submitData.icon || undefined, // 将 null 转换为 undefined 以匹配 CreateRouteDto 类型
                  });

                  // 刷新数据
                  // 这里可以触发重新获取数据的逻辑
                  console.log('Route created successfully:', submitData);
                } catch (error) {
                  console.error('Failed to create route:', error);
                  throw error; // 重新抛出错误以便FormDialog处理
                }
              },
            }}
            editDialog={{
              title: '编辑路由',
              description: '修改路由信息',
              schema: editRouteFormSchema,
              component: form => <RouteFormComponent form={form} isEdit={true} />,
              transformToFormData: (rowData: RouteItem) => ({
                name: rowData.name,
                icon: rowData.icon || '',
                parentId: rowData.parentId || '',
                role: rowData.role, // 提取角色ID
                isEnabled: !rowData.isHidden, // 转换：isHidden -> isEnabled
              }),
              onSubmit: async (data: RouteFormData, originalData: RouteItem) => {
                try {
                  // 转换数据格式：isEnabled -> isHidden
                  const submitData = {
                    name: data.name,
                    icon: data.icon || null,
                    parentId: data.parentId || null,
                    role: data.role,
                    isHidden: !data.isEnabled, // 注意：这里需要取反
                  };

                  console.log('Route updated successfully:', submitData);
                } catch (error) {
                  console.error('Failed to update route:', error);
                  throw error; // 重新抛出错误以便FormDialog处理
                }
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
