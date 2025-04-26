import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from './ModalBase';
import { ModalFooter } from './ModalFooter';

import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';

// 定义表单验证模式
const groupSchema = z.object({
  groupName: z.string().min(1, '分组名称不能为空'),
});

// 推导表单数据类型
type GroupFormData = z.infer<typeof groupSchema>;

export function DirectEditGroupModal() {
  // 从上下文中获取状态和方法
  const {
    updateGroup,
    ui: { showEditGroupDialog, setShowEditGroupDialog, editingGroup, setEditingGroup },
  } = useUserManagement();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      groupName: '',
    },
  });

  // 当编辑分组变更时，更新表单数据
  React.useEffect(() => {
    if (editingGroup) {
      reset({
        groupName: editingGroup.groupName || '',
      });
    }
  }, [editingGroup, reset]);

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showEditGroupDialog) {
      reset();
    }
  }, [showEditGroupDialog, reset]);

  // 处理表单提交
  const onSubmit = async (data: GroupFormData) => {
    if (editingGroup) {
      try {
        updateGroup({
          id: editingGroup.id,
          groupName: data.groupName,
        });
        setShowEditGroupDialog(false);
        reset();
      } catch (error) {
        console.error('更新分组失败:', error);
      }
    }
  };

  // 关闭对话框时的处理函数
  const handleClose = () => {
    setShowEditGroupDialog(false);
    reset();
  };

  if (!editingGroup) return null;

  return (
    <ModalBase
      isOpen={showEditGroupDialog}
      onClose={handleClose}
      title="编辑分组"
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
      <VStack className="py-4">
        <VStack className="space-y-2">
          <Text className="text-gray-700">分组名称</Text>
          <Controller
            control={control}
            name="groupName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input>
                <InputField
                  placeholder="请输入分组名称"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </Input>
            )}
          />
          {errors.groupName && (
            <Text className="text-red-500 text-xs mt-1">{errors.groupName.message}</Text>
          )}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
