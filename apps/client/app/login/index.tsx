import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, LoginSchemaType } from '@smart-lock/shared/shared';
import { useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { EyeIcon, EyeOffIcon, Icon } from '@/components/ui/icon';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';
import { useAuthApi } from '@/hooks/useAuth';

export default function Login() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuthApi();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 设置页面标题
  React.useEffect(() => {
    // 这里可以设置页面标题，但我们已经在Stack.Screen中设置了
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      phone: '',
      password: '',
    },
  });

  const handleTogglePassword = () => {
    setShowPassword(prevState => !prevState);
  };

  const onSubmit = async (data: LoginSchemaType) => {
    setIsLoading(true);

    try {
      const res = await login({
        phone: data.phone,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      toast({
        title: '登录成功',
        description: `欢迎回来，${res.user.nikeName}！`,
        duration: 3000,
      });
      router.push('/');
    } catch (error) {
      console.error('error', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="px-6 py-12 space-y-8">
        <VStack className="items-center space-y-4">
          <Box className="h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Icon as={Lock} className="h-10 w-10 text-white"></Icon>
          </Box>
          <Heading size="xl" className="font-bold">
            <Text>智能门锁</Text>
          </Heading>
          <Text className="text-gray-500">安全便捷的智能家居解决方案</Text>
        </VStack>

        <VStack space="md" className="space-y-6">
          <VStack space="xs">
            <Text className="text-typography-500">手机号</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputSlot className="pl-3">
                    <InputIcon className="h-5 w-5 text-gray-400" as={Mail} />
                  </InputSlot>
                  <InputField
                    placeholder="请输入手机号"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
              )}
            />
            {errors.phone && <Text className="text-error-500 text-xs">{errors.phone.message}</Text>}
          </VStack>

          <VStack space="xs">
            <Text className="text-typography-500">密码</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputSlot className="pl-3">
                    <InputIcon className="h-5 w-5 text-gray-400" as={Lock} />
                  </InputSlot>
                  <InputField
                    placeholder="请输入密码"
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureTextEntry={!showPassword}
                  />
                  <InputSlot className="pr-3" onPress={handleTogglePassword}>
                    <InputIcon as={showPassword ? EyeIcon : EyeOffIcon} />
                  </InputSlot>
                </Input>
              )}
            />
            {errors.password && (
              <Text className="text-error-500 text-xs">{errors.password.message}</Text>
            )}
          </VStack>

          <Button onPress={handleSubmit(onSubmit)} disabled={isLoading} className="w-full mt-4">
            <ButtonText>{isLoading ? '登录中...' : '登录'}</ButtonText>
          </Button>

          <Box className="items-center mt-4">
            <Text className="text-gray-600">
              还没有账号?{' '}
              <Text className="text-primary" onPress={() => router.push('/register')}>
                立即注册
              </Text>
            </Text>
          </Box>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
