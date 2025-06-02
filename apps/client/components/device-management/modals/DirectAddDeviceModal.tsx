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

// 定义表单验证模式
const addDeviceSchema = z.object({
  deviceId: z.string().min(1, '设备ID不能为空'),
  groupId: z.string().min(1, '请选择分组'),
});

// 推导表单数据类型
type AddDeviceFormData = z.infer<typeof addDeviceSchema>;

/**
 * 直接从上下文获取数据的AddDeviceModal组件
 */
export function DirectAddDeviceModal() {
  const { deviceGroups, createDevice, ui } = useDeviceManagement();

  const showAddDeviceDialog = ui.showAddDeviceDialog || false;
  const setShowAddDeviceDialog = ui.setShowAddDeviceDialog || (() => {});
  const newDevice = ui.newDevice || {};

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddDeviceFormData>({
    resolver: zodResolver(addDeviceSchema),
    defaultValues: {
      deviceId: newDevice.deviceId || '',
      groupId: newDevice.groupId || '',
    },
  });

  // 处理表单提交
  const onSubmit = async (data: AddDeviceFormData) => {
    try {
      await createDevice(data.deviceId);

      // 如果需要更新设备分组，可以在这里添加额外逻辑
      // await operations.updateDeviceGroup(data.deviceId, data.groupId);

      setShowAddDeviceDialog(false);
      reset();
    } catch (error) {
      console.error('绑定设备失败:', error);
    }
  };

  // 关闭对话框时的处理函数
  const handleClose = () => {
    setShowAddDeviceDialog(false);
    reset();
  };

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showAddDeviceDialog) {
      reset();
    } else {
      // 当对话框打开时，使用当前的 newDevice 值重置表单
      reset({
        deviceId: newDevice.deviceId || '',
        groupId: newDevice.groupId || '',
      });
    }
  }, [showAddDeviceDialog, newDevice, reset]);

  return (
    <ModalBase
      isOpen={showAddDeviceDialog}
      onClose={handleClose}
      title="绑定新设备"
      footer={
        <ModalFooter
          onCancel={handleClose}
          onConfirm={handleSubmit(onSubmit)}
          confirmText="绑定设备"
          isLoading={isSubmitting}
          isConfirmDisabled={Object.keys(errors).length > 0}
        />
      }
    >
      <VStack className="space-y-6">
        <VStack className="space-y-3 gap-2">
          <Text className="text-gray-700 font-medium">设备ID</Text>
          <Controller
            control={control}
            name="deviceId"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input isInvalid={!!errors.deviceId} className="mt-1">
                <InputField
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="请输入设备ID"
                />
              </Input>
            )}
          />
          {errors.deviceId && (
            <Text className="text-sm text-red-500 mt-1">{errors.deviceId.message}</Text>
          )}
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
