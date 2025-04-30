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

interface AddDeviceModalProps {
  showAddDeviceDialog: boolean;
  setShowAddDeviceDialog: (show: boolean) => void;
  newDevice: { name: string; groupId: string };
  setNewDevice: (device: { name: string; groupId: string }) => void;
  deviceGroups: DeviceGroup[];
  handleAddDevice: () => void;
}

export function AddDeviceModal({
  showAddDeviceDialog,
  setShowAddDeviceDialog,
  newDevice,
  setNewDevice,
  deviceGroups,
  handleAddDevice,
}: AddDeviceModalProps) {
  return (
    <Modal isOpen={showAddDeviceDialog} onClose={() => setShowAddDeviceDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">添加新设备</Text>
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
                  value={newDevice.name || ''}
                  onChangeText={text => setNewDevice({ ...newDevice, name: text })}
                />
              </Input>
            </VStack>
            <VStack className="">
              <Text className="text-gray-700">设备分组</Text>
              <Select onValueChange={value => setNewDevice({ ...newDevice, groupId: value })}>
                <SelectTrigger>
                  <SelectInput placeholder="选择分组" className="flex-1 text-ellipsis" />
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
          <Button variant="outline" className="mr-2" onPress={() => setShowAddDeviceDialog(false)}>
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleAddDevice}>
            <ButtonText>添加</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
