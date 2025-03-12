import React from "react";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";

interface DeleteDeviceModalProps {
  showDeleteDeviceDialog: boolean;
  setShowDeleteDeviceDialog: (show: boolean) => void;
  deviceToDelete: { id: string; name: string; groupId: string } | null;
  confirmDeleteDevice: () => void;
}

export function DeleteDeviceModal({
  showDeleteDeviceDialog,
  setShowDeleteDeviceDialog,
  deviceToDelete,
  confirmDeleteDevice,
}: DeleteDeviceModalProps) {
  return (
    <AlertDialog isOpen={showDeleteDeviceDialog} onClose={() => setShowDeleteDeviceDialog(false)}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <AlertDialogHeader>
          <Text className="text-lg font-bold">确认删除设备</Text>
        </AlertDialogHeader>
        <AlertDialogBody>
          <Text className="text-gray-700">
            您确定要删除设备 "{deviceToDelete?.name}" 吗？此操作无法撤销。
          </Text>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button
            variant="outline"
            className="mr-2"
            onPress={() => setShowDeleteDeviceDialog(false)}
          >
            <ButtonText>取消</ButtonText>
          </Button>
          <Button
            variant="solid"
            action="negative"
            onPress={confirmDeleteDevice}
          >
            <ButtonText>确认删除</ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
