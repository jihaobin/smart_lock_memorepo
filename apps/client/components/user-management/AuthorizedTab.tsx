import { Plus, Search, MoreVertical } from 'lucide-react-native';
import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon } from '@/components/ui/input';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton';
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
  isLoading?: {
    users?: boolean;
    groups?: boolean;
  };

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
  isLoading,
}: AuthorizedTabProps) {
  const isLoadingUsers = isLoading?.users;
  const isLoadingGroups = isLoading?.groups;

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

          {isLoadingGroups ? (
            <Box className="space-y-4 py-4">
              <HStack className="space-x-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </HStack>
              <HStack className="space-x-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </HStack>
            </Box>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-2"
              contentContainerStyle={{ paddingVertical: 8 }}
            >
              <HStack className="items-center space-x-3 gap-2">
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
                          {group.groupName}
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
          )}
        </Box>

        {isLoadingUsers ? (
          <VStack className="gap-4 py-4">
            {[...Array(3)].map((_, i) => (
              <Box key={i} className="p-4 rounded-lg bg-white shadow-sm border border-gray-100">
                <HStack className="items-center">
                  <VStack className="flex-1 min-w-0 space-y-2">
                    <SkeletonText className="h-5 w-3/4" />
                    <SkeletonText className="h-4 w-1/2" />
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : filteredUsers.length > 0 ? (
          <VStack className="gap-4">
            {filteredUsers.map(user => (
              <Box
                key={user.id}
                className="p-4 rounded-lg bg-white shadow-sm border border-gray-100"
              >
                <HStack className="justify-between">
                  <VStack>
                    <Text className="font-medium">{user.remarkName}</Text>
                    <HStack className="items-center mt-1">
                      <Text className="text-sm text-gray-500">
                        分组：{groups.find(g => g.id === user.friendGroupId)?.groupName}
                      </Text>
                    </HStack>
                  </VStack>
                  <HStack className="space-x-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 rounded-full p-0"
                      onPress={() => handleUserAction(user)}
                    >
                      <Icon as={MoreVertical} className="h-4 w-4 text-red-500" />
                    </Button>
                  </HStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box className="items-center justify-center py-12">
            <Text className="text-gray-500">没有找到用户</Text>
          </Box>
        )}
      </VStack>
    </ScrollView>
  );
}
