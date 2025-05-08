import { Edit2, Camera } from 'lucide-react-native';
import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { AuthorizedUser } from '@/types/user-management';

interface ProfileTabProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editedUser: AuthorizedUser | null;
  setEditedUser: React.Dispatch<React.SetStateAction<AuthorizedUser | null>>;
  handleSaveProfile: () => void;
}

export function ProfileTab({
  isEditing,
  setIsEditing,
  editedUser,
  setEditedUser,
  handleSaveProfile,
}: ProfileTabProps) {
  // 处理编辑切换
  const handleEditToggle = () => {
    if (isEditing) {
      // 如果当前是编辑状态，点击按钮则保存
      handleSaveProfile();
    } else {
      // 如果当前不是编辑状态，点击则进入编辑模式
      setIsEditing(true);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="space-y-6 px-4 py-4 pb-6">
        <Box className="bg-white rounded-xl shadow p-4 border border-gray-100">
          <HStack className="justify-between items-center mb-4">
            <VStack>
              <Text className="text-lg font-semibold">个人资料</Text>
              <Text className="text-sm text-gray-500 mt-1">管理您的个人信息</Text>
            </VStack>
          </HStack>

          <VStack className="space-y-4">
            {/* 头像区域 */}
            <Box className="items-center">
              <Box className="relative">
                <TouchableOpacity className="absolute bottom-0 right-0 bg-primary rounded-full p-2 shadow">
                  <Icon as={Camera} className="h-4 w-4 text-white" />
                </TouchableOpacity>
              </Box>
            </Box>

            {/* 姓名输入框 */}
            <VStack className="space-y-2">
              <Text className="text-gray-700">姓名</Text>
              <Input>
                <InputField
                  value={editedUser?.remarkName || ''}
                  onChangeText={(name: string) =>
                    setEditedUser((prev: AuthorizedUser | null) =>
                      prev ? { ...prev, name: name } : null
                    )
                  }
                  editable={isEditing}
                  className="bg-white"
                />
              </Input>
            </VStack>
          </VStack>
        </Box>

        {/* 编辑/保存按钮 */}
        <Button
          className="w-full"
          variant={isEditing ? 'solid' : 'outline'}
          onPress={handleEditToggle}
        >
          {isEditing ? (
            <ButtonText>保存修改</ButtonText>
          ) : (
            <HStack className="items-center space-x-2 gap-2">
              <Icon as={Edit2} className="h-4 w-4" />
              <ButtonText>编辑个人信息</ButtonText>
            </HStack>
          )}
        </Button>
      </VStack>
    </ScrollView>
  );
}
