import React from "react";
import { ChevronLeft } from "lucide-react-native";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
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
import type { DeviceGroup } from "@/types/device-management";

interface AddGroupModalProps {
  showAddGroupDialog: boolean;
  setShowAddGroupDialog: (show: boolean) => void;
  newGroup: { name: string };
  setNewGroup: (group: { name: string }) => void;
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
            <Icon as={ChevronLeft} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-4 py-4">
            <VStack className="space-y-2">
              <Text className="text-gray-700">分组名称</Text>
              <Input>
                <InputField
                  value={newGroup.name || ""}
                  onChangeText={(text) =>
                    setNewGroup({ name: text })
                  }
                />
              </Input>
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowAddGroupDialog(false)}
            className="mr-2"
          >
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
