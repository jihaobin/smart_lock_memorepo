import { X } from 'lucide-react-native';
import React from 'react';

import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import type { Group } from '@/types/user-management';

interface DeleteGroupModalProps {
  showDeleteGroupDialog: boolean;
  setShowDeleteGroupDialog: (show: boolean) => void;
  groupToDelete: Group | null;
  confirmDeleteGroup: () => void;
}

export function DeleteGroupModal({
  showDeleteGroupDialog,
  setShowDeleteGroupDialog,
  groupToDelete,
  confirmDeleteGroup,
}: DeleteGroupModalProps) {
  return (
    <Modal isOpen={showDeleteGroupDialog} onClose={() => setShowDeleteGroupDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">确认删除分组</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <Text>
            您确定要删除分组 "{groupToDelete?.name}"
            吗？此操作将删除该分组下的所有用户，且无法撤销。
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowDeleteGroupDialog(false)}
            className="mr-2"
          >
            <ButtonText>取消</ButtonText>
          </Button>
          <Button variant="solid" onPress={confirmDeleteGroup}>
            <ButtonText>确认删除</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
