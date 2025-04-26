import { Link } from 'expo-router';
import { LogIn, LogOut } from 'lucide-react-native';

import { Button } from './ui/button';
import { Icon } from './ui/icon';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <Box>
      <Box className="bg-white border-b border-gray-200 py-4">
        <HStack className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-primary">
            <Text>智能门锁</Text>
          </Link>
          {user ? (
            <HStack className="flex items-center gap-2">
              <Link href="/user-management" className="text-sm text-gray-600 hover:text-primary">
                {user.nikeName}
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
              <Link href="/login" className="text-sm text-primary hover:underline">
                <Text>登录</Text>
              </Link>
            </HStack>
          )}
        </HStack>
      </Box>
    </Box>
  );
}
