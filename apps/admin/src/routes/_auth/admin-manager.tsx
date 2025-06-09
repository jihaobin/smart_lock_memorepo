import {
  AdminUserItem,
  UpdateAdminUserType,
  CreateAdminUserSchema,
  UpdateAdminUserSchema,
} from '@smart-lock/shared';
import { keepPreviousData } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { User2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import Select from 'react-select';

import { ConfigurableDataTable } from '@/components/configurable-data-table';
import RoleBadge from '@/components/role-badge';
import {
  Form,
  FormControl,
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
import { useUserApi } from '@/hooks/useAdminUserApi';

// 定义表单验证schema
const userFormSchema = CreateAdminUserSchema;

// 编辑时的表单验证schema（密码可选）
const editUserFormSchema = UpdateAdminUserSchema;

type UserFormData = Required<z.infer<typeof userFormSchema>>;
type EditUserFormData = z.infer<typeof editUserFormSchema>;

export const Route = createFileRoute('/_auth/admin-manager')({
  component: UserManager,
  staticData: {
    title: '用户管理',
    icon: <User2 size={16} />,
  },
  loader: async ({ context: { queryClient } }) => {
    const userData = await queryClient.fetchQuery({
      queryKey: ['users', { page: 1, pageSize: 10 }],
      queryFn: () => apiClient.getPage('/adminUser/all'),
    });
    return userData;
  },
});

function UserComponent() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState<AdminUserItem[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { data: apiData, isFetching } = queryHooks.usePaginatedQuery<AdminUserItem>(
    ['users'],
    '/adminUser/all',
    { page, pageSize },
    {
      placeholderData: keepPreviousData,
    }
  );

  // 表格列配置
  const columns: ColumnDef<AdminUserItem>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      enableResizing: true,
    },
    {
      accessorKey: 'name',
      header: '用户名',
      enableSorting: true,
    },
    {
      accessorKey: 'role',
      header: '角色',
      enableSorting: true,
      cell: ({ row }) =>
        row.original.roles.map((role, index) => (
          <RoleBadge key={index} role={role.name}></RoleBadge>
        )),
    },
    {
      accessorKey: 'createdAt',
      header: '创建时间',
      enableSorting: true,
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
                setUserToDelete(row.original.id);
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

  const { useRoles, useCreateUser, useUpdateUser, useDeleteUser } = useUserApi();
  const roles = useRoles();
  const { mutateAsync: createUser } = useCreateUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { mutateAsync: deleteUser } = useDeleteUser();

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete);
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

  // 表单组件
  function UserFormComponent({
    form,
    isEdit = false,
  }: {
    form: UseFormReturn<UserFormData | EditUserFormData>;
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
                <FormLabel>用户名</FormLabel>
                <FormControl>
                  <Input placeholder="请输入用户名" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEdit ? '新密码（可选）' : '密码'}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={isEdit ? '留空表示不修改密码' : '请输入密码'}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色</FormLabel>
                <FormControl>
                  <Select
                    isMulti
                    options={(roles.data ?? []).map(item => ({
                      value: item.id,
                      label: item.name,
                    }))}
                    value={(roles.data ?? [])
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
              title: '添加用户',
              description: '创建新的用户',
              schema: userFormSchema,
              defaultValues: {
                name: '',
                password: '',
                roleIds: [],
              },
              component: form => <UserFormComponent form={form} isEdit={false} />,
              onSubmit: async (data: UserFormData) => {
                try {
                  await createUser({
                    name: data.name,
                    password: data.password,
                    roleIds: data.roleIds,
                  });
                } catch (error) {
                  console.error('Failed to create user:', error);
                  throw error;
                }
              },
            }}
            editDialog={{
              title: '编辑用户',
              description: '修改用户信息',
              schema: editUserFormSchema,
              component: form => <UserFormComponent form={form} isEdit={true} />,
              transformToFormData: (rowData: AdminUserItem) => {
                return {
                  name: rowData.name,
                  roleIds: rowData.roles.map(role => role.id),
                };
              },
              onSubmit: async (data: EditUserFormData, originalData: AdminUserItem) => {
                try {
                  const submitData: UpdateAdminUserType = {
                    name: data.name,
                    roleIds: data.roleIds,
                  };

                  // 只有当密码不为空时才包含密码字段
                  if (data.password && data.password.trim() !== '') {
                    submitData.password = data.password;
                  }

                  await updateUser({
                    userData: submitData,
                    id: originalData.id,
                  });
                } catch (error) {
                  console.error('Failed to update user:', error);
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
