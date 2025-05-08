import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from '../../ModalBase';
import { ModalFooter } from '../../ModalFooter';

import CreatePassword from '@/components/create_password';
import { Input, InputField } from '@/components/ui/input';
import {
  Select,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';

// 定义表单验证模式
const editUserSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  group: z.string().min(1, '请选择分组'),
  lock_password: z.string().length(6, '密码必须是6位数字').optional().or(z.literal('')),
});

// 推导表单数据类型
type EditUserFormData = z.infer<typeof editUserSchema>;

export function DirectEditUserModal() {
  // 从上下文中获取状态和方法
  const {
    updateUser,
    groups,
    ui: { showEditUserDialog, setShowEditUserDialog, editingUser },
  } = useUserManagement();

  // 初始化 react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: editingUser?.remarkName || '',
      group: groups.find(g => g.id === editingUser?.friendGroupId)?.groupName || '',
      lock_password: editingUser?.linkedPasswords || '',
    },
  });

  // 处理表单提交
  const onSubmit = async (data: EditUserFormData) => {
    if (editingUser) {
      try {
        await updateUser(editingUser.id, {
          remarkName: data.name,
          friendGroupId: data.group,
          linkedPasswords: data.lock_password,
        });
        setShowEditUserDialog(false);
        reset();
      } catch (error) {
        console.error('更新用户失败:', error);
      }
    }
  };

  // 关闭对话框时的处理函数
  const handleClose = () => {
    setShowEditUserDialog(false);
    reset();
  };

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showEditUserDialog || !editingUser) {
      reset();
    } else {
      reset({
        name: editingUser.remarkName || '',
        group: groups.find(g => g.id === editingUser.friendGroupId)?.groupName || '',
        lock_password: editingUser.linkedPasswords || '',
      });
    }
  }, [showEditUserDialog, editingUser, reset]);

  // 如果没有选中的用户，不渲染模态框
  if (!editingUser) return null;

  return (
    <ModalBase
      isOpen={showEditUserDialog}
      onClose={handleClose}
      title="编辑用户"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onConfirm={handleSubmit(onSubmit)}
          confirmText="保存更改"
          isLoading={isSubmitting}
          isConfirmDisabled={Object.keys(errors).length > 0}
        />
      }
    >
      <VStack className="space-y-4">
        <VStack className="space-y-2">
          <Text className="text-gray-700">姓名</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.name}>
                <InputField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入姓名"
                />
              </Input>
            )}
          />
          {errors.name && <Text className="text-sm text-red-500">{errors.name.message}</Text>}
        </VStack>

        <VStack className="space-y-2">
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
                placeholder="更新密码（可选）"
              />
            )}
          />
        </VStack>

        <VStack className="space-y-2">
          <Text className="text-gray-700">用户分组</Text>
          <Controller
            control={control}
            name="group"
            render={({ field: { onChange, value } }) => (
              <Select selectedValue={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                  <SelectInput placeholder="选择分组" className="flex-1 text-ellipsis" />
                  <SelectIcon />
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
                        value={group.groupName}
                        className="p-3"
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            )}
          />
          {errors.group && <Text className="text-sm text-red-500">{errors.group.message}</Text>}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
