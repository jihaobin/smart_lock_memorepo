import { AlertTriangle } from 'lucide-react-native';
import React from 'react';

import { ModalBase } from './ModalBase';
import { ModalFooter } from './ModalFooter';

import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';

export function DeleteUserModal() {
  const {
    deleteUser,
    ui: { showDeleteUserDialog, setShowDeleteUserDialog, userToDelete },
  } = useUserManagement();

  // 如果没有要删除的用户，不显示对话框
  if (!userToDelete) return null;

  // 确认删除用户
  const handleConfirmDelete = async () => {
    if (userToDelete) {
      try {
        await deleteUser(userToDelete.id, userToDelete.name);
        setShowDeleteUserDialog(false);
      } catch (error) {
        console.error('删除用户失败:', error);
      }
    }
  };

  return (
    <ModalBase
      isOpen={showDeleteUserDialog}
      onClose={() => setShowDeleteUserDialog(false)}
      title="删除用户"
      footer={
        <ModalFooter
          onCancel={() => setShowDeleteUserDialog(false)}
          onConfirm={handleConfirmDelete}
          confirmText="确认删除"
          cancelText="取消"
          isDanger
          isLoading={false}
        />
      }
    >
      <VStack className="space-y-4">
        <HStack className="items-center space-x-2">
          <Icon as={AlertTriangle} size="md" color="#EF4444" />
          <Text className="text-red-500 font-bold">警告：此操作不可逆</Text>
        </HStack>
        <Text>
          您确定要删除用户 <Text className="font-bold">{userToDelete.name}</Text> 吗？
          删除后，该用户将无法再访问系统，相关的所有访问记录将被保留。
        </Text>
      </VStack>
    </ModalBase>
  );
}
