import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from '../../ModalBase';
import { ModalFooter } from '../../ModalFooter';

import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useDeviceManagement } from '@/contexts/cevice-management-context';

// 定义表单验证模式
const addGroupSchema = z.object({
  name: z.string().min(1, '分组名称不能为空'),
});

// 推导表单数据类型
type AddGroupFormData = z.infer<typeof addGroupSchema>;

/**
 * 直接从上下文获取数据的AddGroupModal组件
 */
export function DirectAddGroupModal() {
  const { createDeviceGroup, ui } = useDeviceManagement();

  const showAddGroupDialog = ui.showAddGroupDialog || false;
  const setShowAddGroupDialog = ui.setShowAddGroupDialog || (() => {});
  const newGroup = ui.newGroup || {};

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddGroupFormData>({
    resolver: zodResolver(addGroupSchema),
    defaultValues: {
      name: newGroup.name || '',
    },
  });

  // 处理表单提交
  const onSubmit = async (data: AddGroupFormData) => {
    try {
      await createDeviceGroup({
        name: data.name,
        devices: [],
      });

      setShowAddGroupDialog(false);
      reset();
    } catch (error) {
      console.error('添加分组失败:', error);
    }
  };

  // 关闭对话框时的处理函数
  const handleClose = () => {
    setShowAddGroupDialog(false);
    reset();
  };

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showAddGroupDialog) {
      reset();
    } else {
      // 当对话框打开时，使用当前的 newGroup 值重置表单
      reset({
        name: newGroup.name || '',
      });
    }
  }, [showAddGroupDialog, newGroup, reset]);

  return (
    <ModalBase
      isOpen={showAddGroupDialog}
      onClose={handleClose}
      title="添加设备分组"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onConfirm={handleSubmit(onSubmit)}
          confirmText="添加分组"
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
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入分组名称"
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
