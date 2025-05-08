import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from '../../ModalBase';
import { ModalFooter } from '../../ModalFooter';

import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDeviceManagement } from '@/contexts/DeviceManagementContext';
import type { DeviceGroup } from '@/types/device-management';

// 定义表单验证模式
const editGroupSchema = z.object({
  name: z.string().min(1, '分组名称不能为空'),
});

// 推导表单数据类型
type EditGroupFormData = z.infer<typeof editGroupSchema>;

/**
 * 直接从上下文获取数据的EditGroupModal组件
 */
export function DirectEditGroupModal() {
  // 从上下文中获取状态和方法
  const { updateDeviceGroup, ui } = useDeviceManagement();

  const showEditGroupDialog = ui.showEditGroupDialog || false;
  const setShowEditGroupDialog = ui.setShowEditGroupDialog || (() => {});
  const editingGroup = ui.editingGroup as DeviceGroup | null;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditGroupFormData>({
    resolver: zodResolver(editGroupSchema),
    defaultValues: {
      name: '',
    },
  });

  // 当编辑分组变更时，更新表单数据
  React.useEffect(() => {
    if (editingGroup) {
      reset({
        name: editingGroup.name || '',
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
  const onSubmit = async (data: EditGroupFormData) => {
    if (editingGroup) {
      try {
        await updateDeviceGroup({
          ...editingGroup,
          name: data.name,
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
      <VStack className="space-y-6">
        <VStack className="space-y-3 gap-2">
          <Text className="text-gray-700 font-medium">分组名称</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.name} className="mt-1">
                <InputField
                  placeholder="请输入分组名称"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              </Input>
            )}
          />
          {errors.name && <Text className="text-sm text-red-500 mt-1">{errors.name.message}</Text>}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
