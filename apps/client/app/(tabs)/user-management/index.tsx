import React from "react";
import {
  View,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  QrCode,
} from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";

// 导入拆分后的组件
import { AuthorizedTab } from "@/components/user-management/tabs/AuthorizedTab";
import { ProfileTab } from "@/components/user-management/tabs/ProfileTab";
import { AddUserModal } from "@/components/user-management/modals/AddUserModal";
import { AddGroupModal } from "@/components/user-management/modals/AddGroupModal";
import { EditUserModal } from "@/components/user-management/modals/EditUserModal";
import { EditGroupModal } from "@/components/user-management/modals/EditGroupModal";
import { DeleteUserModal } from "@/components/user-management/modals/DeleteUserModal";
import { DeleteGroupModal } from "@/components/user-management/modals/DeleteGroupModal";
import { QRCodeModal } from "@/components/user-management/modals/QRCodeModal";
import { UserActionModal } from "@/components/user-management/modals/UserActionModal";
import { GroupActionModal } from "@/components/user-management/modals/GroupActionModal";

// 导入自定义钩子
import { useUserManagement } from "@/hooks/user-management/useUserManagement";


export default function UserManagement() {
  const { user } = useAuth();
  
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
    <View className="flex-1 bg-white">
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
        <View className="bg-gray-100 mx-4 rounded-lg overflow-hidden p-2">
          <HStack>
            {tabs.map((tab, index) => (
              <TouchableOpacity
                key={tab.key}
                className={`flex-1 py-2.5 items-center ${
                  activeTab === index ? "bg-white" : "bg-gray-100"
                }`}
                style={{
                  borderTopLeftRadius: index === 0 ? 8 : 0,
                  borderBottomLeftRadius: index === 0 ? 8 : 0,
                  borderTopRightRadius: index === tabs.length - 1 ? 8 : 0,
                  borderBottomRightRadius: index === tabs.length - 1 ? 8 : 0,
                }}
                onPress={() => setActiveTab(index)}
              >
                <Text
                  className={`font-medium text-sm ${
                    activeTab === index ? "text-black" : "text-gray-500"
                  }`}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            ))}
          </HStack>
        </View>

        {/* Tab内容 */}
        <View className="flex-1 mt-4">
          <View style={{ display: activeTab === 0 ? 'flex' : 'none', flex: 1 }}>
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
          </View>
          <View style={{ display: activeTab === 1 ? 'flex' : 'none', flex: 1 }}>
            <ProfileTab
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              editedUser={editedUser}
              setEditedUser={setEditedUser}
            />
          </View>
        </View>

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

        <QRCodeModal
          showQRCode={showQRCode}
          setShowQRCode={setShowQRCode}
        />

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
    </View>
  );
}
