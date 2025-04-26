import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from './ModalBase';
import { ModalFooter } from './ModalFooter';

import { Input, InputField } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectTrigger,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { AuthorizedUser, Group } from '@/types/user-management';

const userSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('请输入有效的电子邮箱').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  group: z.string().min(1, '请选择用户分组'),
});

type UserFormData = z.infer<typeof userSchema>;

interface EditUserModalProps {
  showEditUserDialog: boolean;
  setShowEditUserDialog: (show: boolean) => void;
  editingUser: AuthorizedUser | null;
  groups: Group[];
  handleSaveEditedUser: (userData: UserFormData) => Promise<void>;
  isEditing?: boolean;
}

export function EditUserModal({
  showEditUserDialog,
  setShowEditUserDialog,
  editingUser,
  groups,
  handleSaveEditedUser,
  isEditing = false,
}: EditUserModalProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      group: '',
    },
  });

  // 当编辑用户变更时，更新表单数据
  React.useEffect(() => {
    if (editingUser) {
      setValue('name', editingUser.name || '');
      setValue('email', editingUser.email || '');
      setValue('phone', editingUser.phone || '');
      setValue('group', editingUser.group || '');
    }
  }, [editingUser, setValue]);

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showEditUserDialog) {
      reset();
    }
  }, [showEditUserDialog, reset]);

  const onSubmit = async (data: UserFormData) => {
    await handleSaveEditedUser(data);
  };

  const handleClose = () => {
    setShowEditUserDialog(false);
    reset();
  };

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
          isLoading={isSubmitting || isEditing}
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
                  placeholder="请输入用户姓名"
                />
              </Input>
            )}
          />
          {errors.name && <Text className="text-red-500 text-xs">{errors.name.message}</Text>}
        </VStack>

        <VStack className="space-y-2">
          <Text className="text-gray-700">电子邮箱</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.email}>
                <InputField
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入电子邮箱地址"
                  keyboardType="email-address"
                />
              </Input>
            )}
          />
          {errors.email && <Text className="text-red-500 text-xs">{errors.email.message}</Text>}
        </VStack>

        <VStack className="space-y-2">
          <Text className="text-gray-700">手机号码</Text>
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.phone}>
                <InputField
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入手机号码"
                  keyboardType="phone-pad"
                />
              </Input>
            )}
          />
          {errors.phone && <Text className="text-red-500 text-xs">{errors.phone.message}</Text>}
        </VStack>

        <VStack className="space-y-2">
          <Text className="text-gray-700">用户分组</Text>
          <Controller
            control={control}
            name="group"
            render={({ field: { onChange, value } }) => (
              <Select selectedValue={value} onValueChange={onChange} isInvalid={!!errors.group}>
                <SelectTrigger>
                  <SelectInput placeholder="选择分组" />
                  <SelectIcon />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} label={group.groupName} value={group.id} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            )}
          />
          {errors.group && <Text className="text-red-500 text-xs">{errors.group.message}</Text>}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
