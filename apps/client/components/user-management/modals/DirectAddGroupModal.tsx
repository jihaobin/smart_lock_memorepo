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

export function DirectAddGroupModal() {
  // 从上下文中获取状态和方法
  const {
    createGroup,
    ui: { showAddGroupDialog, setShowAddGroupDialog, newGroup },
  } = useUserManagement();

  // 初始化 react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      groupName: newGroup.groupName || '',
    },
  });

  // 处理表单提交
  const onSubmit = async (data: GroupFormData) => {
    try {
      const groupData = {
        ...newGroup,
        groupName: data.groupName,
      };

      await createGroup(groupData);
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

  // 当对话框关闭或打开时同步表单数据
  React.useEffect(() => {
    if (!showAddGroupDialog) {
      reset();
    } else {
      reset({
        groupName: newGroup.groupName || '',
      });
    }
  }, [showAddGroupDialog, newGroup, reset]);

  return (
    <ModalBase
      isOpen={showAddGroupDialog}
      onClose={handleClose}
      title="添加新分组"
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
      <VStack className="py-4">
        <VStack className="space-y-2">
          <Text className="text-gray-700">分组名称</Text>
          <Controller
            control={control}
            name="groupName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.groupName}>
                <InputField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入分组名称"
                />
              </Input>
            )}
          />
          {errors.groupName && (
            <Text className="text-sm text-red-500">{errors.groupName.message}</Text>
          )}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
