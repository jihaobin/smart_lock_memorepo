import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from './ModalBase';
import { ModalFooter } from './ModalFooter';

import CreatePassword from '@/components/create_password';
import { Input, InputField } from '@/components/ui/input';
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';

// 定义表单验证模式
const addUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  lock_password: z.string().length(6, '密码必须是6位数字').optional(),
  group: z.string().min(1, '请选择分组'),
});

// 推导表单数据类型
type AddUserFormData = z.infer<typeof addUserSchema>;

export function DirectAddUserModal() {
  // 从上下文中获取状态和方法
  const {
    createUser,
    groups,
    ui: { showAddUserDialog, setShowAddUserDialog, newUser },
  } = useUserManagement();

  // 初始化 react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: newUser.remarkName || '',
      group: newUser.friendGroupId || '',
      lock_password: newUser.linkedPasswords || '',
    },
  });

  // 处理表单提交
  const onSubmit = async (data: AddUserFormData) => {
    console.log(data);
    try {
      await createUser({
        remarkName: data.name,
        linkedPasswords: data.lock_password,
        friendGroupId: data.group,
      });
      setShowAddUserDialog(false);
      reset();
    } catch (error) {
      console.error('添加用户失败:', error);
    }
  };

  // 关闭对话框时的处理函数
  const handleClose = () => {
    setShowAddUserDialog(false);
    reset();
  };

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showAddUserDialog) {
      reset();
    } else {
      // 当对话框打开时，使用当前的 newUser 值重置表单
      reset({
        name: newUser.remarkName || '',
        group: newUser.friendGroupId || '',
        lock_password: newUser.linkedPasswords || '',
      });
    }
  }, [showAddUserDialog, newUser, reset]);

  return (
    <ModalBase
      isOpen={showAddUserDialog}
      onClose={handleClose}
      title="添加新用户"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onConfirm={handleSubmit(onSubmit)}
          confirmText="添加用户"
          isLoading={isSubmitting}
          isConfirmDisabled={Object.keys(errors).length > 0}
        />
      }
    >
      <VStack className="space-y-6">
        <VStack className="space-y-3 gap-2">
          <Text className="text-gray-700 font-medium">姓名</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.name} className="mt-1">
                <InputField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入姓名"
                />
              </Input>
            )}
          />
          {errors.name && <Text className="text-sm text-red-500 mt-1">{errors.name.message}</Text>}
        </VStack>

        <VStack className="space-y-3 gap2">
          <Controller
            control={control}
            name="lock_password"
            render={({ field: { onChange, value } }) => (
              <CreatePassword
                value={value || ''}
                onChange={onChange}
                refreshPassword={genPassword => {
                  onChange(genPassword);
                }}
                errors={{ code: errors.lock_password }}
                placeholder="设置6位数字密码"
              />
            )}
          />
        </VStack>

        <VStack className="space-y-3 gap-2 mt-2">
          <Text className="text-gray-700 font-medium">用户分组</Text>
          <Controller
            control={control}
            name="group"
            render={({ field: { onChange, value } }) => (
              <Select selectedValue={value} onValueChange={onChange} className="mt-1">
                <SelectTrigger>
                  <SelectInput placeholder="选择分组" />
                  {/* <SelectIcon /> */}
                </SelectTrigger>
                <SelectPortal>
                  <SelectBackdrop />
                  <SelectContent>
                    <SelectDragIndicatorWrapper>
                      <SelectDragIndicator />
                    </SelectDragIndicatorWrapper>
                    {groups.map(group => (
                      <SelectItem
                        key={group.id}
                        label={group.groupName}
                        value={group.id}
                        className="p-3"
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            )}
          />
          {errors.group && (
            <Text className="text-sm text-red-500 mt-1">{errors.group.message}</Text>
          )}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
