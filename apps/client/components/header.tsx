import { Link } from "expo-router";
import { LogIn, User } from "lucide-react-native";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { HStack } from "@/components/ui/hstack";
import { Pressable } from "@/components/ui/pressable";
import { View } from "react-native";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react-native";
import { Icon } from "./ui/icon";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <View>
      <Box className="bg-white border-b border-gray-200 py-4">
        <HStack className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            智能门锁
          </Link>
          {user ? (
            <HStack className="flex items-center gap-2">
              <Link
                href="/profile"
                className="text-sm text-gray-600 hover:text-primary"
              >
                {user.name}
              </Link>
              <Button variant="link" size="sm" onPress={logout}>
                <HStack className="items-center justify-center">
                  <Icon as={LogOut} className="h-4 w-4 mr-2r" />
                  <Text>退出登录</Text>
                </HStack>
              </Button>
            </HStack>
          ) : (
            <HStack className="items-center justify-center gap-2">
              <Icon as={LogIn} className="h-4 w-4 mr-2r text-primary" />
              <Link
                href="/login"
                className="text-sm text-primary hover:underline"
              >
                登录
              </Link>
            </HStack>
          )}
        </HStack>
      </Box>
    </View>
  );
}
