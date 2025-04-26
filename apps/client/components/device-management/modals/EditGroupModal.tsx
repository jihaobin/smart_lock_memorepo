import { ChevronLeft } from 'lucide-react-native';
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
import type { DeviceGroup } from '@/types/device-management';

interface EditGroupModalProps {
  showEditGroupDialog: boolean;
  setShowEditGroupDialog: (show: boolean) => void;
  editingGroup: DeviceGroup | null;
  setEditingGroup: React.Dispatch<React.SetStateAction<DeviceGroup | null>>;
  handleSaveEditedGroup: () => void;
}

export function EditGroupModal({
  showEditGroupDialog,
  setShowEditGroupDialog,
  editingGroup,
  setEditingGroup,
  handleSaveEditedGroup,
}: EditGroupModalProps) {
  return (
    <Modal isOpen={showEditGroupDialog} onClose={() => setShowEditGroupDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">编辑分组</Text>
          <ModalCloseButton>
            <Icon as={ChevronLeft} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-4 py-4">
            <VStack className="space-y-2">
              <Text className="text-gray-700">分组名称</Text>
              <Input>
                <InputField
                  value={editingGroup?.name || ''}
                  onChangeText={(text: string) =>
                    setEditingGroup(prev => (prev ? { ...prev, name: text } : null))
                  }
                />
              </Input>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" className="mr-2" onPress={() => setShowEditGroupDialog(false)}>
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleSaveEditedGroup}>
            <ButtonText>保存更改</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
