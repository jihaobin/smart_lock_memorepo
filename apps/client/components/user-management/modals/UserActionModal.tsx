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
import type { AuthorizedUser } from "@/types/user-management";

interface UserActionModalProps {
  showUserActionDialog: boolean;
  setShowUserActionDialog: (show: boolean) => void;
  selectedActionUser: AuthorizedUser | null;
  handleEditUser: (user: AuthorizedUser) => void;
  handleDeleteUser: (user: AuthorizedUser) => void;
}

export function UserActionModal({
  showUserActionDialog,
  setShowUserActionDialog,
  selectedActionUser,
  handleEditUser,
  handleDeleteUser,
}: UserActionModalProps) {
  return (
    <Modal isOpen={showUserActionDialog} onClose={() => setShowUserActionDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">用户操作</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-2 py-2">
            <TouchableOpacity 
              className="px-4 py-3 flex-row items-center" 
              onPress={() => {
                if (selectedActionUser) {
                  handleEditUser(selectedActionUser);
                }
              }}
            >
              <Icon as={Edit2} className="h-5 w-5 mr-3 text-gray-700" />
              <Text className="text-gray-700">编辑用户</Text>
            </TouchableOpacity>
            
            <View className="h-px bg-gray-100 mx-4" />
            
            <TouchableOpacity 
              className="px-4 py-3 flex-row items-center" 
              onPress={() => {
                if (selectedActionUser) {
                  handleDeleteUser(selectedActionUser);
                }
              }}
            >
              <Icon as={Trash2} className="h-5 w-5 mr-3 text-red-600" />
              <Text className="text-red-600">删除用户</Text>
            </TouchableOpacity>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowUserActionDialog(false)}
            className="w-full"
          >
            <ButtonText>取消</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
