import { Link, router } from 'expo-router';
import { Plus, Settings, Search, MoreVertical } from 'lucide-react-native';
import { useMemo } from 'react';
import { TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

// 导入模态框组件
import { DirectAddDeviceModal } from '@/components/device-management/modals/DirectAddDeviceModal';
import { DirectAddGroupModal } from '@/components/device-management/modals/DirectAddGroupModal';
import { DirectDeleteDeviceModal } from '@/components/device-management/modals/DirectDeleteDeviceModal';
import { DirectDeleteGroupModal } from '@/components/device-management/modals/DirectDeleteGroupModal';
import { DirectDeviceActionModal } from '@/components/device-management/modals/DirectDeviceActionModal';
import { DirectEditDeviceModal } from '@/components/device-management/modals/DirectEditDeviceModal';
import { DirectEditGroupModal } from '@/components/device-management/modals/DirectEditGroupModal';
import { DirectGroupActionModal } from '@/components/device-management/modals/DirectGroupActionModal';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
// 导入上下文提供者
import { DeviceManagementProvider, useDeviceManagement } from '@/contexts/DeviceManagementContext';
import { DeviceViewModel } from '@/types/device-management';
import {
  getDeviceDisplayName,
  getOnlineStatusText,
  getFormattedBatteryLevel,
} from '@/utils/device-utils';

// 设备组与设备类型，用于页面渲染
interface DeviceGroupWithDevices {
  id: string;
  name: string;
  devices: DeviceViewModel[];
}

// 主页面内容组件
function DeviceManagementContent() {
  // 使用useDeviceManagementApi的useDevicesWithGroups获取带设备的分组数据
  const {
    // 直接从上下文获取数据
    deviceGroups,
    devices,
    // 从UI对象获取属性和方法
    ui,
  } = useDeviceManagement();

  // 从ui对象中解构出需要的属性和方法
  const {
    // 状态
    searchText,
    setSearchText,
    selectedGroup,
    setSelectedGroup,

    // 引用
    scrollViewRef,

    // 操作方法
    deviceActions,
    groupActions,
  } = ui;

  // 构建带设备的分组数据
  const groupsWithDevices: DeviceGroupWithDevices[] = useMemo(() => {
    return deviceGroups.map(group => ({
      id: group.id,
      name: group.name,
      devices: devices.filter(device => device.groupId === group.id),
    }));
  }, [deviceGroups, devices]);

  // 获取过滤后的设备组
  const filteredGroups = groupsWithDevices.filter(group =>
    selectedGroup === null || selectedGroup === group.id
      ? group.devices.some(device =>
          getDeviceDisplayName(device).toLowerCase().includes(searchText.toLowerCase())
        )
      : false
  );

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="flex-1">
        <HStack className="items-center justify-between px-4 py-6">
          <Text className="text-xl font-bold">设备管理</Text>
        </HStack>
        <VStack className="space-y-4 px-4 py-6 gap-4">
          <Button className="w-full" onPress={() => router.push('/device-management/add')}>
            <HStack className="items-center space-x-2 gap-2">
              <Icon as={Plus} className="h-4 w-4 text-white" />
              <ButtonText>绑定新设备</ButtonText>
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
                onPress={() => ui.setShowAddGroupDialog(true)}
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
                          onPress={() => groupActions.handleAction(group)}
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
                  .filter(device =>
                    getDeviceDisplayName(device).toLowerCase().includes(searchText.toLowerCase())
                  )
                  .map(device => (
                    <Box
                      key={device.id}
                      className="p-4 rounded-lg bg-white shadow-sm border border-gray-100"
                    >
                      <HStack className="justify-between">
                        <VStack>
                          <Text className="font-medium">{getDeviceDisplayName(device)}</Text>
                          <HStack className="items-center mt-1">
                            <Box
                              className={`w-2 h-2 rounded-full mr-2 ${
                                device.isOnline ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            />
                            <Text className="text-sm text-gray-500">
                              {getOnlineStatusText(device)}
                            </Text>
                            <Text className="text-sm text-gray-500 mx-2">•</Text>
                            <Text className="text-sm text-gray-500">
                              电量 {getFormattedBatteryLevel(device)}
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
                            onPress={() => deviceActions.handleAction(device)}
                          >
                            <Icon as={MoreVertical} className="h-4 w-4 text-red-500" />
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  ))}

                {group.devices.filter(device =>
                  getDeviceDisplayName(device).toLowerCase().includes(searchText.toLowerCase())
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

      {/* 模态框组件 - 使用从上下文获取数据的模态框 */}
      <DirectAddDeviceModal />
      <DirectAddGroupModal />
      <DirectEditDeviceModal />
      <DirectEditGroupModal />
      <DirectDeleteDeviceModal />
      <DirectDeleteGroupModal />
      <DirectDeviceActionModal />
      <DirectGroupActionModal />
    </ScrollView>
  );
}

// 导出包含上下文提供者的页面组件
export default function DeviceManagement() {
  return (
    <DeviceManagementProvider>
      <DeviceManagementContent />
    </DeviceManagementProvider>
  );
}

const styles = StyleSheet.create({
  ScrollView: {
    paddingVertical: 8,
  },
});
