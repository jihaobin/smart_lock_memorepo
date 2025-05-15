import { Plus } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { AuthorizedTab } from '@/components/user-management/AuthorizedTab';
import { DeleteGroupModal } from '@/components/user-management/modals/DeleteGroupModal';
import { DeleteUserModal } from '@/components/user-management/modals/DeleteUserModal';
import { DirectAddGroupModal } from '@/components/user-management/modals/DirectAddGroupModal';
import { DirectAddUserModal } from '@/components/user-management/modals/DirectAddUserModal';
import { DirectEditGroupModal } from '@/components/user-management/modals/DirectEditGroupModal';
import { DirectEditUserModal } from '@/components/user-management/modals/DirectEditUserModal';
import { DirectGroupActionModal } from '@/components/user-management/modals/DirectGroupActionModal';
import { DirectUserActionModal } from '@/components/user-management/modals/UserActionModal';
import { ProfileTab } from '@/components/user-management/ProfileTab';
/* 导入上下文提供者 */
import { UserManagementProvider, useUserManagement } from '@/contexts/UserManagementContext';
import { AuthorizedUser } from '@/types/user-management';

// 定义样式
const styles = StyleSheet.create({
  firstTab: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  lastTab: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  tabContent: {
    flex: 1,
  },
  activeTab: {
    display: 'flex',
  },
  inactiveTab: {
    display: 'none',
  },
});

// 主页面内容组件
function UserManagementContent() {
  // 使用上下文钩子获取状态和方法
  const {
    // 直接从上下文获取的属性
    groups,
    filteredUsers,
    isLoadingUsers,
    // 从UI对象获取属性和方法
    ui,
  } = useUserManagement();

  // 从ui对象中解构出需要的属性和方法
  const {
    // 状态
    activeTab,
    setActiveTab,
    tabs,
    searchText,
    setSearchText,
    isEditing,
    setIsEditing,
    selectedGroup,
    setSelectedGroup,
    editedUser,
    setEditedUser,
    setShowAddUserDialog,
    setShowAddGroupDialog,

    // Refs
    scrollViewRef,

    // 基本方法
    handleScroll,

    // 用户和群组操作方法
    userActions,
    groupActions,
  } = ui;

  // 将操作方法映射为组件中使用的处理函数
  const handleUserAction = userActions.handleAction;

  const handleGroupAction = groupActions.handleAction;

  const handleSaveProfile = () => {
    // 实现保存个人资料的逻辑
    setIsEditing(false);
  };

  return (
    <Box className="flex-1 bg-white">
      <VStack className="flex-1">
        <HStack className="items-center justify-between px-4 py-6">
          <Text className="text-xl font-bold">用户管理</Text>
        </HStack>
        <VStack className="space-y-4 px-4 py-6 gap-4">
          <Button className="w-full" onPress={() => setShowAddUserDialog(true)}>
            <HStack className="items-center space-x-2 gap-2">
              <Icon as={Plus} className="h-4 w-4 text-white" />
              <ButtonText>添加新用户</ButtonText>
            </HStack>
          </Button>
        </VStack>

        {/* 自定义Tab栏 */}
        <Box className="bg-gray-100 mx-4 rounded-lg overflow-hidden p-2">
          <HStack>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.key}
                className={`flex-1 py-2.5 items-center ${
                  activeTab === index ? 'bg-white' : 'bg-gray-100'
                }`}
                style={[
                  index === 0 ? styles.firstTab : null,
                  index === tabs.length - 1 ? styles.lastTab : null,
                ]}
                onPress={() => setActiveTab(index)}
              >
                <Text
                  className={`font-medium text-sm ${
                    activeTab === index ? 'text-black' : 'text-gray-500'
                  }`}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </HStack>
        </Box>

        {/* Tab内容 */}
        <Box className="flex-1 mt-4">
          <Box style={[styles.tabContent, activeTab === 0 ? styles.activeTab : styles.inactiveTab]}>
            <AuthorizedTab
              searchText={searchText}
              setSearchText={setSearchText}
              selectedGroup={selectedGroup}
              setSelectedGroup={setSelectedGroup}
              groups={groups}
              filteredUsers={filteredUsers}
              scrollViewRef={scrollViewRef}
              handleScroll={handleScroll}
              handleUserAction={handleUserAction}
              handleGroupAction={handleGroupAction}
              setShowAddGroupDialog={setShowAddGroupDialog}
              isLoading={{ users: isLoadingUsers }}
            />
          </Box>
          <Box style={[styles.tabContent, activeTab === 1 ? styles.activeTab : styles.inactiveTab]}>
            <ProfileTab
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedUser={editedUser as AuthorizedUser}
              setEditedUser={
                setEditedUser as React.Dispatch<React.SetStateAction<AuthorizedUser | null>>
              }
              handleSaveProfile={handleSaveProfile}
            />
          </Box>
        </Box>

        {/* 各种模态框组件 - 使用直接绑定上下文的新模态框 */}
        <DirectAddUserModal />
        <DirectAddGroupModal />
        <DirectEditUserModal />
        <DirectEditGroupModal />
        <DirectUserActionModal />
        <DirectGroupActionModal />

        {/* 删除用户和群组的模态框现在已使用直接从上下文获取数据的方式实现，不再需要传递props */}
        <DeleteUserModal />
        <DeleteGroupModal />
      </VStack>
    </Box>
  );
}

// 导出包含上下文提供者的页面组件
export default function UserManagement() {
  return (
    <UserManagementProvider>
      <UserManagementContent />
    </UserManagementProvider>
  );
}
