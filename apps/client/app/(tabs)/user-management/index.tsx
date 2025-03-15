import { Plus, QrCode } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
/* 导入拆分后的组件 */
import { AddGroupModal } from '@/components/user-management/modals/AddGroupModal';
import { AddUserModal } from '@/components/user-management/modals/AddUserModal';
import { DeleteGroupModal } from '@/components/user-management/modals/DeleteGroupModal';
import { DeleteUserModal } from '@/components/user-management/modals/DeleteUserModal';
import { EditGroupModal } from '@/components/user-management/modals/EditGroupModal';
import { EditUserModal } from '@/components/user-management/modals/EditUserModal';
import { GroupActionModal } from '@/components/user-management/modals/GroupActionModal';
import { QRCodeModal } from '@/components/user-management/modals/QRCodeModal';
import { UserActionModal } from '@/components/user-management/modals/UserActionModal';
import { AuthorizedTab } from '@/components/user-management/tabs/AuthorizedTab';
import { ProfileTab } from '@/components/user-management/tabs/ProfileTab';
/* 导入自定义钩子 */
import { useUserManagement } from '@/hooks/user-management/useUserManagement';
import { AuthorizedUser } from '@/types/management';

export default function UserManagement() {
  // 使用自定义钩子管理状态和逻辑
  const {
    // 状态
    activeTab,
    setActiveTab,
    tabs,
    searchText,
    setSearchText,
    showQRCode,
    setShowQRCode,
    isEditing,
    setIsEditing,
    selectedGroup,
    setSelectedGroup,
    groups,
    filteredUsers,
    editedUser,
    setEditedUser,
    showAddUserDialog,
    setShowAddUserDialog,
    showAddGroupDialog,
    setShowAddGroupDialog,
    showEditUserDialog,
    setShowEditUserDialog,
    showEditGroupDialog,
    setShowEditGroupDialog,
    showDeleteUserDialog,
    setShowDeleteUserDialog,
    showDeleteGroupDialog,
    setShowDeleteGroupDialog,
    showUserActionDialog,
    setShowUserActionDialog,
    showGroupActionDialog,
    setShowGroupActionDialog,
    newUser,
    setNewUser,
    newGroup,
    setNewGroup,
    editingUser,
    setEditingUser,
    editingGroup,
    setEditingGroup,
    userToDelete,
    groupToDelete,
    selectedActionUser,
    selectedActionGroup,

    // Refs
    scrollViewRef,

    // 方法
    handleScroll,
    handleUserAction,
    handleEditUser,
    handleDeleteUser,
    confirmDeleteUser,
    handleAddUser,
    handleSaveEditedUser,
    handleGroupAction,
    handleAddGroup,
    handleEditGroup,
    handleDeleteGroup,
    confirmDeleteGroup,
    handleSaveEditedGroup,
  } = useUserManagement();

  return (
    <Box className="flex-1 bg-white">
      <VStack className="flex-1">
        <HStack className="items-center justify-between px-4 py-6">
          <HStack className="items-center">
            <Text className="text-xl font-bold">用户管理</Text>
          </HStack>
          <HStack className="space-x-2 gap-4">
            <Button
              size="sm"
              variant="outline"
              className="h-10 w-10 rounded-full"
              onPress={() => setShowQRCode(true)}
            >
              <Icon as={QrCode} className="h-5 w-5" />
            </Button>
            <Button
              size="sm"
              variant="solid"
              className="h-10 w-10 rounded-full"
              onPress={() => setShowAddUserDialog(true)}
            >
              <Icon as={Plus} className="h-5 w-5" />
            </Button>
          </HStack>
        </HStack>

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
            />
          </Box>
        </Box>

        {/* 各种模态框组件 */}
        <AddUserModal
          showAddUserDialog={showAddUserDialog}
          setShowAddUserDialog={setShowAddUserDialog}
          newUser={newUser}
          setNewUser={setNewUser}
          groups={groups}
          handleAddUser={handleAddUser}
        />

        <AddGroupModal
          showAddGroupDialog={showAddGroupDialog}
          setShowAddGroupDialog={setShowAddGroupDialog}
          newGroup={newGroup}
          setNewGroup={setNewGroup}
          handleAddGroup={handleAddGroup}
        />

        <EditUserModal
          showEditUserDialog={showEditUserDialog}
          setShowEditUserDialog={setShowEditUserDialog}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          groups={groups}
          handleSaveEditedUser={handleSaveEditedUser}
        />

        <EditGroupModal
          showEditGroupDialog={showEditGroupDialog}
          setShowEditGroupDialog={setShowEditGroupDialog}
          editingGroup={editingGroup}
          setEditingGroup={setEditingGroup}
          handleSaveEditedGroup={handleSaveEditedGroup}
        />

        <DeleteUserModal
          showDeleteUserDialog={showDeleteUserDialog}
          setShowDeleteUserDialog={setShowDeleteUserDialog}
          userToDelete={userToDelete}
          confirmDeleteUser={confirmDeleteUser}
        />

        <DeleteGroupModal
          showDeleteGroupDialog={showDeleteGroupDialog}
          setShowDeleteGroupDialog={setShowDeleteGroupDialog}
          groupToDelete={groupToDelete}
          confirmDeleteGroup={confirmDeleteGroup}
        />

        <QRCodeModal showQRCode={showQRCode} setShowQRCode={setShowQRCode} />

        <UserActionModal
          showUserActionDialog={showUserActionDialog}
          setShowUserActionDialog={setShowUserActionDialog}
          selectedActionUser={selectedActionUser}
          handleEditUser={handleEditUser}
          handleDeleteUser={handleDeleteUser}
        />

        <GroupActionModal
          showGroupActionDialog={showGroupActionDialog}
          setShowGroupActionDialog={setShowGroupActionDialog}
          selectedActionGroup={selectedActionGroup}
          handleEditGroup={handleEditGroup}
          handleDeleteGroup={handleDeleteGroup}
        />
      </VStack>
    </Box>
  );
}

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
