import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import {
  Edit2,
  Users,
  Camera,
} from "lucide-react-native";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import type { AuthorizedUser } from "../../../app/(tabs)/user-management/types";

interface ProfileTabProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editedUser: AuthorizedUser | null;
  setEditedUser: React.Dispatch<React.SetStateAction<AuthorizedUser | null>>;
}

export function ProfileTab({
  isEditing,
  setIsEditing,
  editedUser,
  setEditedUser,
}: ProfileTabProps) {
  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="space-y-6 px-4 py-4">
        <View className="items-center">
          <View className="relative">
            <Box className="h-24 w-24 rounded-full bg-gray-100 items-center justify-center overflow-hidden">
              {editedUser?.avatar ? (
                <Image
                  source={{ uri: editedUser.avatar }}
                  alt={editedUser?.name || ""}
                  className="w-full h-full"
                />
              ) : (
                <Icon as={Users} className="h-12 w-12 text-gray-400" />
              )}
            </Box>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-primary rounded-full p-2 shadow">
              <Icon as={Camera} className="h-4 w-4 text-white" />
            </TouchableOpacity>
          </View>
        </View>

        <VStack className="space-y-4">
          <VStack className="space-y-2">
            <Text className="text-gray-700">姓名</Text>
            <Input>
              <InputField
                value={editedUser?.name || ""}
                onChangeText={(text) =>
                  setEditedUser((prev: AuthorizedUser | null) => prev ? { ...prev, name: text } : null)
                }
                editable={isEditing}
                className="bg-white"
              />
            </Input>
          </VStack>

          <VStack className="space-y-2">
            <Text className="text-gray-700">手机号码</Text>
            <Input>
              <InputField
                value={editedUser?.phone || ""}
                onChangeText={(text) =>
                  setEditedUser((prev: AuthorizedUser | null) => prev ? { ...prev, phone: text } : null)
                }
                editable={isEditing}
                className="bg-white"
              />
            </Input>
          </VStack>

          <VStack className="space-y-2">
            <Text className="text-gray-700">电子邮箱</Text>
            <Input>
              <InputField
                value={editedUser?.email || ""}
                onChangeText={(text) =>
                  setEditedUser((prev: AuthorizedUser | null) => prev ? { ...prev, email: text } : null)
                }
                editable={isEditing}
                className="bg-white"
              />
            </Input>
          </VStack>
        </VStack>

        <Button
          className="w-full"
          variant={isEditing ? "solid" : "outline"}
          onPress={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <ButtonText>保存修改</ButtonText>
          ) : (
            <HStack className="items-center space-x-2">
              <Icon as={Edit2} className="h-4 w-4" />
              <ButtonText>编辑个人信息</ButtonText>
            </HStack>
          )}
        </Button>
      </VStack>
    </ScrollView>
  );
}
