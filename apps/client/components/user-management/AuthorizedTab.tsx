import { ChevronLeft, Plus, Users, ChevronRight, Search, MoreVertical } from 'lucide-react-native';
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
  handleScroll,
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

          <Box className="relative">
            <TouchableOpacity
              className="absolute left-0 top-1/2 z-10 w-8 h-8 items-center justify-center bg-white/90 rounded-full shadow border"
              style={{ transform: [{ translateY: -16 }] }}
              onPress={() => handleScroll('left')}
            >
              <Icon as={ChevronLeft} className="h-4 w-4 text-gray-600" />
            </TouchableOpacity>
            <TouchableOpacity
              className="absolute right-0 top-1/2 z-10 w-8 h-8 items-center justify-center bg-white/90 rounded-full shadow border"
              style={{ transform: [{ translateY: -16 }] }}
              onPress={() => handleScroll('right')}
            >
              <Icon as={ChevronRight} className="h-4 w-4 text-gray-600" />
            </TouchableOpacity>

            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-2 px-8"
            >
              <HStack className="space-x-2 items-center gap-4">
                <Button
                  variant={selectedGroup === null ? 'solid' : 'outline'}
                  size="sm"
                  onPress={() => setSelectedGroup(null)}
                  className={`rounded-full px-4 ${
                    selectedGroup === null ? 'bg-primary/10 border-primary' : 'bg-transparent'
                  }`}
                >
                  <ButtonText className={selectedGroup === null ? 'text-primary' : 'text-gray-600'}>
                    全部
                  </ButtonText>
                </Button>
                {groups.map(group => (
                  <Box key={group.id} className="flex-row items-center">
                    <Button
                      variant={selectedGroup === group.id ? 'solid' : 'outline'}
                      size="sm"
                      onPress={() => setSelectedGroup(group.id)}
                      className={`rounded-full px-4 ${
                        selectedGroup === group.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-transparent'
                      }`}
                      action={selectedGroup === group.id ? 'primary' : 'secondary'}
                    >
                      <ButtonText
                        className={selectedGroup === group.id ? 'text-primary' : 'text-gray-600'}
                      >
                        {group.name}
                      </ButtonText>
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 ml-1"
                      onPress={() => handleGroupAction(group)}
                    >
                      <Icon as={MoreVertical} className="h-4 w-4 text-gray-500" />
                    </Button>
                  </Box>
                ))}
              </HStack>
            </ScrollView>
          </Box>
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
                        <Icon as={MoreVertical} className="h-4 w-4" />
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
          <VStack className="items-center justify-center py-10">
            <Icon as={Users} className="h-16 w-16 text-gray-300 mb-4" />
            <Text className="text-gray-500 text-center">
              {searchText ? '找不到匹配的用户' : '暂无用户'}
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
    </ScrollView>
  );
}
