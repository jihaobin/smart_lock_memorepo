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
import type { DeviceGroup } from '@/types/device-management';

interface DeleteGroupModalProps {
  showDeleteGroupDialog: boolean;
  setShowDeleteGroupDialog: (show: boolean) => void;
  groupToDelete: DeviceGroup | null;
  confirmDeleteGroup: () => void;
}

export function DeleteGroupModal({
  showDeleteGroupDialog,
  setShowDeleteGroupDialog,
  groupToDelete,
  confirmDeleteGroup,
}: DeleteGroupModalProps) {
  return (
    <AlertDialog isOpen={showDeleteGroupDialog} onClose={() => setShowDeleteGroupDialog(false)}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text className="text-lg font-bold">确认删除分组</Text>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text className="text-gray-700">
            您确定要删除分组 "{groupToDelete?.name}"
            吗？此操作将删除该分组下的所有设备，且无法撤销。
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button
            variant="outline"
            className="mr-2"
            onPress={() => setShowDeleteGroupDialog(false)}
          >
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
