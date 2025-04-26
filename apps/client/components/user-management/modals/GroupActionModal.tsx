import { Edit, Trash, Users } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { ModalBase } from './ModalBase';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { Group } from '@/types/user-management';

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
  if (!selectedActionGroup) return null;

  return (
    <ModalBase
      isOpen={showGroupActionDialog}
      onClose={() => setShowGroupActionDialog(false)}
      title=""
      maxWidth="xs"
      showCloseButton={false}
    >
      <VStack className="bg-white rounded-xl overflow-hidden -m-4">
        <Box className="p-4 border-b border-gray-200">
          <HStack className="items-center space-x-3">
            <Box className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center">
              <Icon as={Users} size="sm" color="#4B5563" />
            </Box>
            <Text className="text-base font-bold">{selectedActionGroup.groupName}</Text>
          </HStack>
        </Box>

        <TouchableOpacity
          className="p-4 border-b border-gray-100"
          onPress={() => {
            setShowGroupActionDialog(false);
            handleEditGroup(selectedActionGroup);
          }}
        >
          <HStack className="items-center space-x-3">
            <Icon as={Edit} size="sm" color="#4B5563" />
            <Text>编辑分组信息</Text>
          </HStack>
        </TouchableOpacity>

        <TouchableOpacity
          className="p-4"
          onPress={() => {
            setShowGroupActionDialog(false);
            handleDeleteGroup(selectedActionGroup);
          }}
        >
          <HStack className="items-center space-x-3">
            <Icon as={Trash} size="sm" color="#EF4444" />
            <Text className="text-red-500">删除分组</Text>
          </HStack>
        </TouchableOpacity>
      </VStack>
    </ModalBase>
  );
}
