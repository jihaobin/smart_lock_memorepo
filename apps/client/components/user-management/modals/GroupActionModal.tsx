import React from "react";
import { View, TouchableOpacity } from "react-native";
import { ChevronLeft, Edit2, Trash2, X } from "lucide-react-native";
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
import type { Group } from "@/types/user-management";

interface GroupActionModalProps {
  showGroupActionDialog: boolean;
  setShowGroupActionDialog: (show: boolean) => void;
  selectedActionGroup: Group | null;
  handleEditGroup: (group: Group) => void;
  handleDeleteGroup: (group: Group) => void;
}

export function GroupActionModal({
  showGroupActionDialog,
  setShowGroupActionDialog,
  selectedActionGroup,
  handleEditGroup,
  handleDeleteGroup,
}: GroupActionModalProps) {
  return (
    <Modal isOpen={showGroupActionDialog} onClose={() => setShowGroupActionDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">分组操作</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-2 py-2">
            <TouchableOpacity 
              className="px-4 py-3 flex-row items-center" 
              onPress={() => {
                if (selectedActionGroup) {
                  handleEditGroup(selectedActionGroup);
                }
              }}
            >
              <Icon as={Edit2} className="h-5 w-5 mr-3 text-gray-700" />
              <Text className="text-gray-700">编辑分组</Text>
            </TouchableOpacity>
            
            <View className="h-px bg-gray-100 mx-4" />
            
            <TouchableOpacity 
              className="px-4 py-3 flex-row items-center" 
              onPress={() => {
                if (selectedActionGroup) {
                  handleDeleteGroup(selectedActionGroup);
                }
              }}
            >
              <Icon as={Trash2} className="h-5 w-5 mr-3 text-red-600" />
              <Text className="text-red-600">删除分组</Text>
            </TouchableOpacity>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowGroupActionDialog(false)}
            className="w-full"
          >
            <ButtonText>取消</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
