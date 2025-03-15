import { Link, router } from 'expo-router';
import { Plus, Settings, Search, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

// 导入模态框组件
import { AddDeviceModal } from '@/components/device-management/modals/AddDeviceModal';
import { AddGroupModal } from '@/components/device-management/modals/AddGroupModal';
import { DeleteDeviceModal } from '@/components/device-management/modals/DeleteDeviceModal';
import { DeleteGroupModal } from '@/components/device-management/modals/DeleteGroupModal';
import { DeviceActionModal } from '@/components/device-management/modals/DeviceActionModal';
import { EditDeviceModal } from '@/components/device-management/modals/EditDeviceModal';
import { EditGroupModal } from '@/components/device-management/modals/EditGroupModal';
import { GroupActionModal } from '@/components/device-management/modals/GroupActionModal';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
// 导入自定义钩子
import { useDeviceManagement } from '@/hooks/device-management/useDeviceManagement';

export default function DeviceManagement() {
  // 使用自定义钩子管理状态和逻辑
  const {
    // 状态
    searchText,
    setSearchText,
    selectedGroup,
    setSelectedGroup,
    deviceGroups,
    filteredGroups,

    // 模态框状态
    showAddDeviceDialog,
    setShowAddDeviceDialog,
    showAddGroupDialog,
    setShowAddGroupDialog,
    showEditDeviceDialog,
    setShowEditDeviceDialog,
    showEditGroupDialog,
    setShowEditGroupDialog,
    showDeleteDeviceDialog,
    setShowDeleteDeviceDialog,
    showDeleteGroupDialog,
    setShowDeleteGroupDialog,
    showDeviceActionDialog,
    setShowDeviceActionDialog,
    showGroupActionDialog,
    setShowGroupActionDialog,

    // 编辑状态
    newDevice,
    setNewDevice,
    newGroup,
    setNewGroup,
    editingDevice,
    setEditingDevice,
    editingGroup,
    setEditingGroup,
    deviceToDelete,
    groupToDelete,
    selectedActionDevice,
    selectedActionGroup,

    // Refs
    scrollViewRef,

    // 方法
    handleDeviceAction,
    handleGroupAction,
    handleAddGroup,
    handleAddDevice,
    handleDeleteGroup,
    confirmDeleteGroup,
    handleDeleteDevice,
    confirmDeleteDevice,
    handleEditDevice,
    handleSaveEditedDevice,
    handleEditGroup,
    handleSaveEditedGroup,
  } = useDeviceManagement();

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="flex-1">
        <HStack className="items-center justify-between px-4 py-6">
          <Text className="text-xl font-bold">设备管理</Text>
        </HStack>
        <VStack className="space-y-4 px-4 py-6 gap-4">
          <Button className="w-full" onPress={() => setShowAddDeviceDialog(true)}>
            <HStack className="items-center space-x-2 gap-2">
              <Icon as={Plus} className="h-4 w-4 text-white" />
              <ButtonText>添加新设备</ButtonText>
            </HStack>
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onPress={() => router.push('/global-settings')}
          >
            <HStack className="items-center space-x-2 gap-2">
              <Icon as={Settings} className="h-4 w-4 text-primary" />
              <ButtonText>全局设置</ButtonText>
            </HStack>
          </Button>
        </VStack>

        <VStack className="space-y-6 px-4 gap-4 pb-6">
          <HStack className="bg-gray-50 rounded-xl p-2">
            <Input className="flex-1 bg-white rounded-lg">
              <InputIcon className="ml-2">
                <Icon as={Search} size="sm" className="text-gray-400" />
              </InputIcon>
              <InputField
                placeholder="搜索设备..."
                value={searchText}
                onChangeText={setSearchText}
              />
            </Input>
          </HStack>

          <Box className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <HStack className="justify-between items-center mb-4">
              <VStack>
                <Text className="text-lg font-semibold">设备分组</Text>
                <Text className="text-sm text-gray-500 mt-1">管理您的设备分组</Text>
              </VStack>
              <Button
                size="sm"
                variant="solid"
                action="default"
                onPress={() => setShowAddGroupDialog(true)}
                className="bg-gray-50"
              >
                <HStack className="items-center space-x-1">
                  <Icon as={Plus} className="h-4 w-4 text-gray-700" />
                  <ButtonText action="secondary" className="text-gray-700">
                    添加分组
                  </ButtonText>
                </HStack>
              </Button>
            </HStack>

            <Box className="py-2 ">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                ref={scrollViewRef}
                contentContainerStyle={styles.ScrollView}
              >
                <HStack className="items-center space-x-3 gap-2">
                  {/* 全部分组标签 */}
                  <TouchableOpacity
                    onPress={() => setSelectedGroup(null)}
                    className={`rounded-lg overflow-hidden ${
                      selectedGroup === null ? 'shadow-sm' : ''
                    }`}
                    activeOpacity={0.8}
                  >
                    <Box
                      className={`px-4 py-2 ${
                        selectedGroup === null ? 'bg-primary' : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          selectedGroup === null ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        全部
                      </Text>
                    </Box>
                  </TouchableOpacity>

                  {deviceGroups.map(group => (
                    <Box key={group.id} className="rounded-lg overflow-hidden shadow-sm">
                      <HStack className="items-stretch">
                        <TouchableOpacity
                          onPress={() => setSelectedGroup(group.id)}
                          className={`px-4 py-2 ${
                            selectedGroup === group.id ? 'bg-primary' : 'bg-gray-100'
                          }`}
                          activeOpacity={0.8}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              selectedGroup === group.id ? 'text-white' : 'text-gray-700'
                            }`}
                          >
                            {group.name}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleGroupAction(group)}
                          className={`px-2 items-center justify-center ${
                            selectedGroup === group.id ? 'bg-primary-700' : 'bg-gray-200'
                          }`}
                          activeOpacity={0.8}
                        >
                          <Icon
                            as={MoreVertical}
                            className={`h-4 w-4 ${
                              selectedGroup === group.id ? 'text-white' : 'text-gray-600'
                            }`}
                          />
                        </TouchableOpacity>
                      </HStack>
                    </Box>
                  ))}
                </HStack>
              </ScrollView>
            </Box>
          </Box>

          {filteredGroups.map(group => (
            <Box key={group.id} className="bg-white rounded-xl shadow p-4 border border-gray-100">
              <HStack className="justify-between items-center mb-4">
                <Text className="text-lg font-semibold">{group.name}</Text>
              </HStack>

              <VStack className="space-y-3">
                {group.devices
                  .filter(device => device.name.toLowerCase().includes(searchText.toLowerCase()))
                  .map(device => (
                    <Box
                      key={device.id}
                      className="p-4 rounded-lg bg-white shadow-sm border border-gray-100"
                    >
                      <HStack className="justify-between">
                        <VStack>
                          <Text className="font-medium">{device.name}</Text>
                          <HStack className="items-center mt-1">
                            <Box
                              className={`w-2 h-2 rounded-full mr-2 ${
                                device.isOnline ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                            <Text className="text-sm text-gray-500">
                              {device.isOnline ? '在线' : '离线'}
                            </Text>
                            <Text className="text-sm text-gray-500 mx-2">•</Text>
                            <Text className="text-sm text-gray-500">
                              电量 {device.batteryLevel}%
                            </Text>
                          </HStack>
                        </VStack>
                        <HStack className="space-x-2 gap-2">
                          <Link
                            href={{
                              pathname: '/device-management/[id]',
                              params: { id: device.id },
                            }}
                            asChild
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 rounded-full p-0 "
                            >
                              <Icon as={Settings} className="h-4 w-4 text-red-500" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0"
                            onPress={() => handleDeviceAction(group.id, device)}
                          >
                            <Icon as={MoreVertical} className="h-4 w-4 text-red-500" />
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  ))}

                {group.devices.filter(device =>
                  device.name.toLowerCase().includes(searchText.toLowerCase())
                ).length === 0 && (
                  <VStack className="items-center justify-center py-4">
                    <Text className="text-gray-500 text-center">
                      {searchText ? '找不到匹配的设备' : '暂无设备'}
                    </Text>
                  </VStack>
                )}
              </VStack>
            </Box>
          ))}

          {filteredGroups.length === 0 && (
            <VStack className="items-center justify-center py-10">
              <Icon as={Settings} className="h-16 w-16 text-gray-300 mb-4" />
              <Text className="text-gray-500 text-center">
                {searchText ? '找不到匹配的设备' : '暂无设备'}
              </Text>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onPress={() => {
                  setSearchText('');
                  setSelectedGroup(null);
                }}
              >
                <ButtonText>重置筛选条件</ButtonText>
              </Button>
            </VStack>
          )}
        </VStack>
      </VStack>

      {/* 模态框组件 */}
      <AddDeviceModal
        showAddDeviceDialog={showAddDeviceDialog}
        setShowAddDeviceDialog={setShowAddDeviceDialog}
        newDevice={newDevice}
        setNewDevice={setNewDevice}
        deviceGroups={deviceGroups}
        handleAddDevice={handleAddDevice}
      />

      <AddGroupModal
        showAddGroupDialog={showAddGroupDialog}
        setShowAddGroupDialog={setShowAddGroupDialog}
        newGroup={newGroup}
        setNewGroup={setNewGroup}
        handleAddGroup={handleAddGroup}
      />

      <EditDeviceModal
        showEditDeviceDialog={showEditDeviceDialog}
        setShowEditDeviceDialog={setShowEditDeviceDialog}
        editingDevice={editingDevice}
        setEditingDevice={setEditingDevice}
        deviceGroups={deviceGroups}
        handleSaveEditedDevice={handleSaveEditedDevice}
      />

      <EditGroupModal
        showEditGroupDialog={showEditGroupDialog}
        setShowEditGroupDialog={setShowEditGroupDialog}
        editingGroup={editingGroup}
        setEditingGroup={setEditingGroup}
        handleSaveEditedGroup={handleSaveEditedGroup}
      />

      <DeleteDeviceModal
        showDeleteDeviceDialog={showDeleteDeviceDialog}
        setShowDeleteDeviceDialog={setShowDeleteDeviceDialog}
        deviceToDelete={deviceToDelete}
        confirmDeleteDevice={confirmDeleteDevice}
      />

      <DeleteGroupModal
        showDeleteGroupDialog={showDeleteGroupDialog}
        setShowDeleteGroupDialog={setShowDeleteGroupDialog}
        groupToDelete={groupToDelete}
        confirmDeleteGroup={confirmDeleteGroup}
      />

      <DeviceActionModal
        isOpen={showDeviceActionDialog}
        onClose={() => setShowDeviceActionDialog(false)}
        selectedActionDevice={selectedActionDevice}
        handleEditDevice={handleEditDevice}
        handleDeleteDevice={handleDeleteDevice}
      />

      <GroupActionModal
        isOpen={showGroupActionDialog}
        onClose={() => setShowGroupActionDialog(false)}
        selectedActionGroup={selectedActionGroup}
        onEdit={handleEditGroup}
        onDelete={handleDeleteGroup}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ScrollView: {
    paddingVertical: 8,
  },
});
