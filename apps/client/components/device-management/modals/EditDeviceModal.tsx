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
import type { DeviceGroup } from '@/types/device-management';

interface EditDeviceModalProps {
  showEditDeviceDialog: boolean;
  setShowEditDeviceDialog: (show: boolean) => void;
  editingDevice: { id: string; name: string; groupId: string } | null;
  setEditingDevice: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; groupId: string } | null>
  >;
  deviceGroups: DeviceGroup[];
  handleSaveEditedDevice: () => void;
}

export function EditDeviceModal({
  showEditDeviceDialog,
  setShowEditDeviceDialog,
  editingDevice,
  setEditingDevice,
  deviceGroups,
  handleSaveEditedDevice,
}: EditDeviceModalProps) {
  return (
    <Modal isOpen={showEditDeviceDialog} onClose={() => setShowEditDeviceDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">编辑设备</Text>
          <ModalCloseButton>
            <Icon as={ChevronLeft} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-4 py-4">
            <VStack className="space-y-2">
              <Text className="text-gray-700">设备名称</Text>
              <Input>
                <InputField
                  value={editingDevice?.name || ''}
                  onChangeText={text =>
                    setEditingDevice(prev => (prev ? { ...prev, name: text } : null))
                  }
                />
              </Input>
            </VStack>
            <VStack className="">
              <Text className="text-gray-700">设备分组</Text>
              <Select
                selectedValue={editingDevice?.groupId}
                onValueChange={value =>
                  setEditingDevice(prev => (prev ? { ...prev, groupId: value } : null))
                }
              >
                <SelectTrigger>
                  <SelectInput
                    placeholder="选择分组"
                    value={deviceGroups.find(g => g.id === editingDevice?.groupId)?.name || ''}
                  />
                  <SelectIcon />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent>
                    {deviceGroups.map(group => (
                      <SelectItem key={group.id} label={group.name} value={group.id} />
                    ))}
                  </SelectContent>
                </SelectPortal>
              </Select>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" className="mr-2" onPress={() => setShowEditDeviceDialog(false)}>
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleSaveEditedDevice}>
            <ButtonText>保存更改</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
