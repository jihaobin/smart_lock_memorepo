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
import { useDeviceManagement } from '@/contexts/cevice-management-context';
import type { DeviceGroup } from '@/types/device-management';

/**
 * 直接从上下文获取数据的DeleteGroupModal组件
 */
export function DirectDeleteGroupModal() {
  // 从上下文中获取状态和方法
  const { deleteDeviceGroup, ui } = useDeviceManagement();

  const showDeleteGroupDialog = ui.showDeleteGroupDialog || false;
  const setShowDeleteGroupDialog = ui.setShowDeleteGroupDialog || (() => {});
  const groupToDelete = ui.groupToDelete as DeviceGroup | null;

  // 确认删除分组
  const confirmDeleteGroup = async () => {
    if (groupToDelete) {
      try {
        await deleteDeviceGroup(groupToDelete.id, groupToDelete.name);
        setShowDeleteGroupDialog(false);
      } catch (error) {
        console.error('删除分组失败:', error);
      }
    }
  };

  // 关闭对话框
  const handleClose = () => {
    setShowDeleteGroupDialog(false);
  };

  if (!groupToDelete) return null;

  return (
    <AlertDialog isOpen={showDeleteGroupDialog} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text className="text-lg font-bold">确认删除分组</Text>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text className="text-gray-700">
            您确定要删除分组 "{groupToDelete.name}" 吗？此操作将删除该分组下的所有设备，且无法撤销。
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" className="mr-2" onPress={handleClose}>
            <ButtonText>取消</ButtonText>
          </Button>
          <Button variant="solid" action="negative" onPress={confirmDeleteGroup}>
            <ButtonText>确认删除</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
