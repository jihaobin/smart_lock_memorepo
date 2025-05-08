import { Edit2, Trash2, X } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
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
import { VStack } from '@/components/ui/vstack';
import { useDeviceManagement } from '@/contexts/DeviceManagementContext';
import type { DeviceGroup } from '@/types/device-management';

/**
 * 直接从上下文获取数据的GroupActionModal组件
 */
export function DirectGroupActionModal() {
  // 从上下文中获取状态和方法
  const { ui } = useDeviceManagement();

  const showGroupActionDialog = ui.showGroupActionDialog || false;
  const setShowGroupActionDialog = ui.setShowGroupActionDialog || (() => {});
  const selectedActionGroup = ui.selectedActionGroup as DeviceGroup | null;
  const groupActions = ui.groupActions || {};

  // 处理编辑分组
  const handleEditGroup = () => {
    if (selectedActionGroup) {
      groupActions.handleEdit?.(selectedActionGroup);
    }
  };

  // 处理删除分组
  const handleDeleteGroup = () => {
    if (selectedActionGroup) {
      groupActions.handleDelete?.(selectedActionGroup);
    }
  };

  // 关闭对话框
  const handleClose = () => {
    setShowGroupActionDialog(false);
  };

  if (!selectedActionGroup) return null;

  return (
    <Modal isOpen={showGroupActionDialog} onClose={handleClose}>
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
                handleEditGroup();
                handleClose();
              }}
            >
              <Icon as={Edit2} className="h-5 w-5 mr-3 text-gray-700" />
              <Text className="text-gray-700">编辑分组</Text>
            </TouchableOpacity>

            <Box className="h-px bg-gray-100 mx-4" />

            <TouchableOpacity
              className="px-4 py-3 flex-row items-center"
              onPress={() => {
                handleDeleteGroup();
                handleClose();
              }}
            >
              <Icon as={Trash2} className="h-5 w-5 mr-3 text-red-600" />
              <Text className="text-red-600">删除分组</Text>
            </TouchableOpacity>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={handleClose} className="w-full">
            <ButtonText>取消</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
