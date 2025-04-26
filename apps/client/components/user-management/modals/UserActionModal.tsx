import { Edit, Trash, Fingerprint, User } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { ModalBase } from './ModalBase';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';
import type { AuthorizedUser } from '@/types/user-management';

interface UserActionModalProps {
  showUserActionDialog: boolean;
  setShowUserActionDialog: (show: boolean) => void;
  selectedActionUser: AuthorizedUser | null;
  handleEditUser: (user: AuthorizedUser) => void;
  handleDeleteUser: (user: AuthorizedUser) => void;
  handleManageFingerprints?: (user: AuthorizedUser) => void;
}

// 使用新的上下文结构的DirectUserActionModal组件
export function DirectUserActionModal() {
  const {
    ui: {
      showUserActionDialog,
      setShowUserActionDialog,
      selectedActionUser,
      setShowEditUserDialog,
      setShowDeleteUserDialog,
      setEditingUser,
      setUserToDelete,
    },
  } = useUserManagement();

  // 如果没有选中的用户，不显示模态框
  if (!selectedActionUser) return null;

  // 编辑用户的处理函数
  const handleEditUser = (user: AuthorizedUser) => {
    setShowUserActionDialog(false);
    setEditingUser(user);
    setShowEditUserDialog(true);
  };

  // 删除用户的处理函数
  const handleDeleteUser = (user: AuthorizedUser) => {
    setShowUserActionDialog(false);
    setUserToDelete(user);
    setShowDeleteUserDialog(true);
  };

  return (
    <ModalBase
      isOpen={showUserActionDialog}
      onClose={() => setShowUserActionDialog(false)}
      title=""
      maxWidth="xs"
      showCloseButton={false}
    >
      <VStack className="bg-white rounded-xl overflow-hidden -m-4">
        <Box className="p-4 border-b border-gray-200">
          <HStack className="items-center space-x-3">
            <Box className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center">
              <Icon as={User} size="sm" color="#4B5563" />
            </Box>
            <Text className="text-base font-bold">{selectedActionUser.remarkName}</Text>
          </HStack>
        </Box>

        <TouchableOpacity
          className="p-4 border-b border-gray-100"
          onPress={() => handleEditUser(selectedActionUser)}
        >
          <HStack className="items-center space-x-3">
            <Icon as={Edit} size="sm" color="#4B5563" />
            <Text>编辑用户信息</Text>
          </HStack>
        </TouchableOpacity>

        <TouchableOpacity className="p-4" onPress={() => handleDeleteUser(selectedActionUser)}>
          <HStack className="items-center space-x-3">
            <Icon as={Trash} size="sm" color="#EF4444" />
            <Text className="text-red-500">删除用户</Text>
          </HStack>
        </TouchableOpacity>
      </VStack>
    </ModalBase>
  );
}
