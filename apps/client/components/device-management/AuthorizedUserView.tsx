import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Users } from "lucide-react-native";
import { Image } from "@/components/ui/image";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";

interface AuthorizedUserViewProps {
  userName?: string;
  onResetFilter: () => void;
}

export function AuthorizedUserView({ userName = "暂无用户", onResetFilter }: AuthorizedUserViewProps) {
  return (
    <VStack className="items-center justify-center py-10">
      <Box className="h-20 w-20 rounded-full bg-gray-100 items-center justify-center mb-3 overflow-hidden">
        <Icon as={Users} className="h-10 w-10 text-gray-300" />
      </Box>
      <Text className="text-base font-medium text-gray-700 mb-1">{userName}</Text>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 px-4 py-1 border border-red-500 rounded-md"
        onPress={onResetFilter}
      >
        <ButtonText className="text-sm text-red-500">重置筛选条件</ButtonText>
      </Button>
    </VStack>
  );
}
