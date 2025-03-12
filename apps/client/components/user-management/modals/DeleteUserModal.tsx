import React from "react";
import { ChevronLeft, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import type { AuthorizedUser } from "@/types/user-management";

interface DeleteUserModalProps {
  showDeleteUserDialog: boolean;
  setShowDeleteUserDialog: (show: boolean) => void;
  userToDelete: AuthorizedUser | null;
  confirmDeleteUser: () => void;
}

export function DeleteUserModal({
  showDeleteUserDialog,
  setShowDeleteUserDialog,
  userToDelete,
  confirmDeleteUser,
}: DeleteUserModalProps) {
  return (
    <Modal isOpen={showDeleteUserDialog} onClose={() => setShowDeleteUserDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">确认删除用户</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <Text>
            您确定要删除用户 "{userToDelete?.name}" 吗？此操作无法撤销。
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowDeleteUserDialog(false)}
            className="mr-2"
          >
            <ButtonText>取消</ButtonText>
          </Button>
          <Button variant="solid" onPress={confirmDeleteUser}>
            <ButtonText>确认删除</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
