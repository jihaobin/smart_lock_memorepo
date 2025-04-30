import { ChevronLeft, Plus, ChevronRight, Search, MoreVertical } from 'lucide-react-native';
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
  handleScroll,
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
            <HStack className="relative">
              <TouchableOpacity
                className="left-0 top-1/2 z-10 w-8 h-8 items-center justify-center bg-white/90 rounded-full shadow border"
                style={{ transform: [{ translateY: -16 }] }}
                onPress={() => handleScroll('left')}
              >
                <Icon as={ChevronLeft} className="h-4 w-4 text-gray-600" />
              </TouchableOpacity>

              <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className="py-2 px-2"
                contentContainerStyle={{ paddingRight: 16 }}
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
                    <ButtonText
                      className={selectedGroup === null ? 'text-primary' : 'text-gray-600'}
                    >
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
                          {group.groupName}
                        </ButtonText>
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 w-8 rounded-full p-0 ml-1"
                        onPress={() => handleGroupAction(group)}
                      >
                        <Icon as={MoreVertical} className="h-4 w-4 text-white" />
                      </Button>
                    </Box>
                  ))}
                </HStack>
              </ScrollView>

              <TouchableOpacity
                className=" right-0 top-1/2 z-10 w-8 h-8 items-center justify-center bg-white/90 rounded-full shadow border"
                style={{ transform: [{ translateY: -16 }] }}
                onPress={() => handleScroll('right')}
              >
                <Icon as={ChevronRight} className="h-4 w-4 text-gray-600" />
              </TouchableOpacity>
            </HStack>
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
                <HStack className="items-center">
                  <VStack className="flex-1 min-w-0">
                    <HStack className="items-center justify-between">
                      <Text className="font-medium" numberOfLines={1}>
                        {user.remarkName}
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
                        分组：{groups.find(groups => groups.id === user.friendGroupId)?.groupName}
                      </Text>
                    </HStack>
                  </VStack>
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
