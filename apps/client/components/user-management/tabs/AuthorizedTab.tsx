import { Plus, Users, Search, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Image } from '@/components/ui/image';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { AuthorizedUser, Group } from '@/types/user-management';

interface AuthorizedTabProps {
  // State
  searchText: string;
  setSearchText: (text: string) => void;
  selectedGroup: string | null;
  setSelectedGroup: (groupId: string | null) => void;
  groups: Group[];
  filteredUsers: AuthorizedUser[];

  // Refs
  scrollViewRef: React.RefObject<ScrollView>;

  // Methods
  handleScroll: (direction: 'left' | 'right') => void;
  handleUserAction: (user: AuthorizedUser) => void;
  handleGroupAction: (group: Group) => void;
  setShowAddGroupDialog: (show: boolean) => void;
}

export function AuthorizedTab({
  searchText,
  setSearchText,
  selectedGroup,
  setSelectedGroup,
  groups,
  filteredUsers,
  scrollViewRef,
  handleUserAction,
  handleGroupAction,
  setShowAddGroupDialog,
}: AuthorizedTabProps) {
  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="space-y-6 px-4 gap-4 pb-6">
        <HStack className="bg-gray-50 rounded-xl p-2">
          <Input className="flex-1 bg-white rounded-lg">
            <InputIcon className="ml-2">
              <Icon as={Search} size="sm" className="text-gray-400" />
            </InputIcon>
            <InputField placeholder="搜索用户..." value={searchText} onChangeText={setSearchText} />
          </Input>
        </HStack>

        <Box className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <HStack className="justify-between items-center mb-4">
            <VStack>
              <Text className="text-lg font-semibold">用户分组</Text>
              <Text className="text-sm text-gray-500 mt-1">管理您的用户权限分组</Text>
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

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-grow py-2"
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
                  className={`px-4 py-2 ${selectedGroup === null ? 'bg-primary' : 'bg-gray-100'}`}
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

              {groups.map(group => (
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

        {filteredUsers.length > 0 ? (
          <VStack className="gap-4">
            {filteredUsers.map(user => (
              <Box
                key={user.id}
                className="p-4 rounded-lg bg-white shadow-sm border border-gray-100"
              >
                <HStack className="items-center">
                  <Box className="h-12 w-12 rounded-full bg-gray-100 items-center justify-center mr-3 overflow-hidden">
                    {user.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        alt={user.name}
                        className="w-full h-full"
                      />
                    ) : (
                      <Icon as={Users} className="h-6 w-6 text-gray-400" />
                    )}
                  </Box>
                  <VStack className="flex-1 min-w-0">
                    <HStack className="items-center justify-between">
                      <Text className="font-medium" numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Button
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onPress={() => handleUserAction(user)}
                      >
                        <Icon as={MoreVertical} className="h-4 w-4 text-white" />
                      </Button>
                    </HStack>
                    <HStack className="items-center mt-1">
                      <Text className="text-sm text-gray-500" numberOfLines={1}>
                        {groups.find(g => g.id === user.group)?.name}
                      </Text>
                      <Text className="mx-2 text-gray-500">•</Text>
                      <Text className="text-sm text-gray-500" numberOfLines={1}>
                        最后访问: {user.lastAccess}
                      </Text>
                    </HStack>
                    <HStack className="mt-2 space-x-2">
                      {user.permissions.map(permission => (
                        <Box
                          key={permission.doorId}
                          className={`px-2 py-1 rounded-full ${
                            permission.type === 'permanent' ? 'bg-green-50' : 'bg-yellow-50'
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              permission.type === 'permanent' ? 'text-green-700' : 'text-yellow-700'
                            }`}
                          >
                            {permission.type === 'permanent' ? '永久' : '临时'}
                          </Text>
                        </Box>
                      ))}
                    </HStack>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <VStack className="items-center justify-center py-10 mt-8">
            <Box className="h-20 w-20 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Icon as={Users} className="h-10 w-10 text-gray-400" />
            </Box>
            <Text className="text-base text-gray-500 text-center mb-6">暂无用户</Text>
            <Button
              variant="outline"
              size="md"
              className="border-primary"
              onPress={() => {
                setSearchText('');
                setSelectedGroup(null);
              }}
            >
              <ButtonText className="text-primary">重置筛选条件</ButtonText>
            </Button>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
