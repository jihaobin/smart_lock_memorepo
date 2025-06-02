import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';

import { ModalBase } from '../../ModalBase';
import { ModalFooter } from '../../ModalFooter';

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
import { useDeviceManagement } from '@/contexts/cevice-management-context';
import type { Device } from '@/types/device-management';

// 定义表单验证模式
const editDeviceSchema = z.object({
  name: z.string().min(1, '设备名称不能为空'),
  groupId: z.string().min(1, '请选择分组'),
});

// 推导表单数据类型
type EditDeviceFormData = z.infer<typeof editDeviceSchema>;

/**
 * 直接从上下文获取数据的EditDeviceModal组件
 */
export function DirectEditDeviceModal() {
  const { deviceGroups, updateDevice, ui } = useDeviceManagement();

  const showEditDeviceDialog = ui.showEditDeviceDialog || false;
  const setShowEditDeviceDialog = ui.setShowEditDeviceDialog || (() => {});
  const editingDevice = ui.editingDevice || null;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditDeviceFormData>({
    resolver: zodResolver(editDeviceSchema),
    defaultValues: {
      name: editingDevice?.name || '',
      groupId: (editingDevice as any)?.groupId || '',
    },
  });

  // 处理表单提交
  const onSubmit = async (data: EditDeviceFormData) => {
    if (!editingDevice) return;

    try {
      await updateDevice(editingDevice.id, {
        name: data.name,
        // 注意：这里应该根据实际情况更新其他需要的字段
      });

      setShowEditDeviceDialog(false);
    } catch (error) {
      console.error('更新设备失败:', error);
    }
  };

  // 关闭对话框时的处理函数
  const handleClose = () => {
    setShowEditDeviceDialog(false);
  };

  // 当编辑设备改变或对话框打开时重置表单
  React.useEffect(() => {
    if (editingDevice) {
      reset({
        name: editingDevice.name || '',
        groupId: (editingDevice as any)?.groupId || '',
      });
    }
  }, [editingDevice, reset]);

  // 如果没有选择设备，不显示模态框
  if (!editingDevice) {
    return null;
  }

  return (
    <ModalBase
      isOpen={showEditDeviceDialog}
      onClose={handleClose}
      title="编辑设备"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onConfirm={handleSubmit(onSubmit)}
          confirmText="保存"
          isLoading={isSubmitting}
          isConfirmDisabled={Object.keys(errors).length > 0}
        />
      }
    >
      <VStack className="space-y-6">
        <VStack className="space-y-3 gap-2">
          <Text className="text-gray-700 font-medium">设备名称</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.name} className="mt-1">
                <InputField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入设备名称"
                />
              </Input>
            )}
          />
          {errors.name && <Text className="text-sm text-red-500 mt-1">{errors.name.message}</Text>}
        </VStack>

        <VStack className="space-y-3 gap-2 mt-2">
          <Text className="text-gray-700 font-medium">所属分组</Text>
          <Controller
            control={control}
            name="groupId"
            render={({ field: { onChange, value } }) => (
              <Select selectedValue={value} onValueChange={onChange} className="mt-1">
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
                    {deviceGroups.map(group => (
                      <SelectItem
                        key={group.id}
                        label={group.name}
                        value={group.id}
                        className="p-3"
                      />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            )}
          />
          {errors.groupId && (
            <Text className="text-sm text-red-500 mt-1">{errors.groupId.message}</Text>
          )}
        </VStack>
      </VStack>
    </ModalBase>
  );
}
