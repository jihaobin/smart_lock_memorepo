import { X } from 'lucide-react-native';
import React from 'react';

import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
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
import { VStack } from '@/components/ui/vstack';
import type { Group } from '@/types/user-management';

interface AddGroupModalProps {
  showAddGroupDialog: boolean;
  setShowAddGroupDialog: (show: boolean) => void;
  newGroup: Partial<Group>;
  setNewGroup: (group: Partial<Group>) => void;
  handleAddGroup: () => void;
}

export function AddGroupModal({
  showAddGroupDialog,
  setShowAddGroupDialog,
  newGroup,
  setNewGroup,
  handleAddGroup,
}: AddGroupModalProps) {
  return (
    <Modal isOpen={showAddGroupDialog} onClose={() => setShowAddGroupDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">添加新分组</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-4 py-4">
            <VStack className="space-y-2">
              <Text className="text-gray-700">分组名称</Text>
              <Input>
                <InputField
                  value={newGroup.name || ''}
                  onChangeText={(text: string | undefined) =>
                    setNewGroup({ ...newGroup, name: text })
                  }
                />
              </Input>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={() => setShowAddGroupDialog(false)} className="mr-2">
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleAddGroup}>
            <ButtonText>添加分组</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
