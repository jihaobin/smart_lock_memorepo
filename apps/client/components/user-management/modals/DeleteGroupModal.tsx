import { AlertTriangle } from 'lucide-react-native';
import React from 'react';

import { ModalBase } from './ModalBase';
import { ModalFooter } from './ModalFooter';

import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useUserManagement } from '@/contexts/UserManagementContext';

export function DeleteGroupModal() {
  const {
    deleteGroup,
    users,
    ui: { showDeleteGroupDialog, setShowDeleteGroupDialog, groupToDelete },
  } = useUserManagement();

  // 如果没有要删除的分组，不显示对话框
  if (!groupToDelete) return null;

  // 确认删除分组
  const handleConfirmDelete = async () => {
    if (groupToDelete) {
      try {
        // 检查是否有用户属于该分组
        const usersInGroup = users.filter(user => user.group === groupToDelete.id);
        if (usersInGroup.length > 0) {
          // 在实际操作中应该使用toast显示错误信息
          console.error(
            `该分组中仍有 ${usersInGroup.length} 个用户，请先移除这些用户或将其分配到其他分组。`
          );
          return;
        }

        await deleteGroup(groupToDelete.id, groupToDelete.groupName);
        setShowDeleteGroupDialog(false);
      } catch (error) {
        console.error('删除分组失败:', error);
      }
    }
  };

  return (
    <ModalBase
      isOpen={showDeleteGroupDialog}
      onClose={() => setShowDeleteGroupDialog(false)}
      title="删除分组"
      footer={
        <ModalFooter
          onCancel={() => setShowDeleteGroupDialog(false)}
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
          您确定要删除分组 <Text className="font-bold">{groupToDelete.groupName}</Text> 吗？
          删除后，此分组下的所有用户将不再属于任何分组。
        </Text>
      </VStack>
    </ModalBase>
  );
}
