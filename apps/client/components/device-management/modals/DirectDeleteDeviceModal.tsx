import React from 'react';

import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useDeviceManagement } from '@/contexts/DeviceManagementContext';
import type { Device } from '@/types/device-management';

/**
 * 直接从上下文获取数据的DeleteDeviceModal组件
 */
export function DirectDeleteDeviceModal() {
  // 从上下文中获取状态和方法
  const { deleteDevice, ui } = useDeviceManagement();

  const showDeleteDeviceDialog = ui.showDeleteDeviceDialog || false;
  const setShowDeleteDeviceDialog = ui.setShowDeleteDeviceDialog || (() => {});
  const deviceToDelete = ui.deviceToDelete as Device | null;

  // 确认删除设备
  const confirmDeleteDevice = async () => {
    if (deviceToDelete) {
      try {
        await deleteDevice(deviceToDelete.id, deviceToDelete.name);
        setShowDeleteDeviceDialog(false);
      } catch (error) {
        console.error('删除设备失败:', error);
      }
    }
  };

  // 关闭对话框
  const handleClose = () => {
    setShowDeleteDeviceDialog(false);
  };

  if (!deviceToDelete) return null;

  return (
    <AlertDialog isOpen={showDeleteDeviceDialog} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text className="text-lg font-bold">确认删除设备</Text>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text className="text-gray-700">
            您确定要删除设备 "{deviceToDelete.name}" 吗？此操作无法撤销。
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" className="mr-2" onPress={handleClose}>
            <ButtonText>取消</ButtonText>
          </Button>
          <Button variant="solid" action="negative" onPress={confirmDeleteDevice}>
            <ButtonText>确认删除</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
