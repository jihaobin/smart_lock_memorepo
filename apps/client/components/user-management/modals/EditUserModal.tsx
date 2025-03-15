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
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { AuthorizedUser, Group } from '@/types/user-management';

interface EditUserModalProps {
  showEditUserDialog: boolean;
  setShowEditUserDialog: (show: boolean) => void;
  editingUser: AuthorizedUser | null;
  setEditingUser: (user: AuthorizedUser | null) => void;
  groups: Group[];
  handleSaveEditedUser: () => void;
}

export function EditUserModal({
  showEditUserDialog,
  setShowEditUserDialog,
  editingUser,
  setEditingUser,
  groups,
  handleSaveEditedUser,
}: EditUserModalProps) {
  return (
    <Modal isOpen={showEditUserDialog} onClose={() => setShowEditUserDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">编辑用户</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-4 py-4">
            <VStack className="space-y-2">
              <Text className="text-gray-700">姓名</Text>
              <Input>
                <InputField
                  value={editingUser?.name || ''}
                  onChangeText={(text: string) =>
                    editingUser && setEditingUser({ ...editingUser, name: text })
                  }
                />
              </Input>
            </VStack>
            <VStack className="space-y-2">
              <Text className="text-gray-700">电子邮箱</Text>
              <Input>
                <InputField
                  value={editingUser?.email || ''}
                  onChangeText={(text: string) =>
                    editingUser && setEditingUser({ ...editingUser, email: text })
                  }
                  keyboardType="email-address"
                />
              </Input>
            </VStack>
            <VStack className="space-y-2">
              <Text className="text-gray-700">手机号码</Text>
              <Input>
                <InputField
                  value={editingUser?.phone || ''}
                  onChangeText={(text: string) =>
                    editingUser && setEditingUser({ ...editingUser, phone: text })
                  }
                  keyboardType="phone-pad"
                />
              </Input>
            </VStack>
            <VStack className="space-y-2">
              <Text className="text-gray-700">用户分组</Text>
              <Select
                selectedValue={editingUser?.group}
                onValueChange={(value: string) =>
                  editingUser && setEditingUser({ ...editingUser, group: value })
                }
              >
                <SelectTrigger>
                  <SelectInput placeholder="选择分组" />
                  <SelectIcon />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    {groups.map(group => (
                      <SelectItem key={group.id} label={group.name} value={group.id} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={() => setShowEditUserDialog(false)} className="mr-2">
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleSaveEditedUser}>
            <ButtonText>保存更改</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
