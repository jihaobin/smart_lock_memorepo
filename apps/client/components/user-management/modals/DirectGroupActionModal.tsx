import { Edit, Group, Trash, Users } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { ModalBase } from './ModalBase';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';

export function DirectGroupActionModal() {
  // 从上下文中获取状态和方法
  const {
    ui: {
      showGroupActionDialog,
      setShowGroupActionDialog,
      selectedActionGroup,
      setShowEditGroupDialog,
      setShowDeleteGroupDialog,
      setEditingGroup,
      setGroupToDelete,
    },
  } = useUserManagement();

  // 如果没有选中的分组，不显示模态框
  if (!selectedActionGroup) return null;

  // 编辑分组的处理函数
  const handleEditGroup = () => {
    setShowGroupActionDialog(false);
    setEditingGroup(selectedActionGroup);
    setShowEditGroupDialog(true);
  };

  // 删除分组的处理函数
  const handleDeleteGroup = () => {
    setShowGroupActionDialog(false);
    setGroupToDelete(selectedActionGroup);
    setShowDeleteGroupDialog(true);
  };

  return (
    <ModalBase
      isOpen={showGroupActionDialog}
      onClose={() => setShowGroupActionDialog(false)}
      title="分组操作"
      maxWidth="xs"
      showCloseButton={true}
    >
      <VStack className="bg-white rounded-xl overflow-hidden -m-4">
        <Box className="p-4 border-b border-gray-200">
          <HStack className="items-center space-x-3 gap-2">
            <Box className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center">
              <Icon as={Group} size="sm" color="#4B5563" />
            </Box>
            <Text className="text-base font-bold">{selectedActionGroup.groupName}</Text>
          </HStack>
        </Box>

        <TouchableOpacity className="p-4 border-b border-gray-100" onPress={handleEditGroup}>
          <HStack className="items-center space-x-3">
            <Icon as={Edit} size="sm" color="#4B5563" />
            <Text>编辑分组信息</Text>
          </HStack>
        </TouchableOpacity>

        <TouchableOpacity className="p-4" onPress={handleDeleteGroup}>
          <HStack className="items-center space-x-3">
            <Icon as={Trash} size="sm" color="#EF4444" />
            <Text className="text-red-500">删除分组</Text>
          </HStack>
        </TouchableOpacity>
      </VStack>
    </ModalBase>
  );
}
