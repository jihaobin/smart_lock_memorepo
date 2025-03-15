import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Lock, Phone, Eye, EyeOff, Mail, User, CheckIcon } from 'lucide-react-native';
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView, TouchableOpacity } from 'react-native';
import { z } from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Checkbox, CheckboxIcon, CheckboxIndicator } from '@/components/ui/checkbox';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';

// 定义表单验证schema
const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少需要2个字符'),
    phoneNumber: z
      .string()
      .min(11, '手机号码必须是11位数字')
      .max(11, '手机号码必须是11位数字')
      .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
    email: z.string().email('请输入有效的电子邮箱'),
    verificationCode: z
      .string()
      .min(4, '验证码至少需要4位')
      .max(6, '验证码最多6位')
      .regex(/^\d+$/, '验证码只能包含数字'),
    password: z
      .string()
      .min(8, '密码至少需要8个字符')
      .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
      .regex(/[a-z]/, '密码需要包含至少一个小写字母')
      .regex(/[0-9]/, '密码需要包含至少一个数字'),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine(val => val === true, {
      message: '您必须同意服务条款和隐私政策',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword'],
  });

// 定义表单数据类型
type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // 初始化 react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: '',
      verificationCode: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const handleSendVerificationCode = () => {
    if (cooldown > 0) return;

    // 验证手机号码格式
    const phoneNumberValue = getValues('phoneNumber');
    const phoneRegex = /^1[3-9]\d{9}$/;

    if (!phoneNumberValue || !phoneRegex.test(phoneNumberValue)) {
      toast({
        title: '手机号码格式错误',
        description: '请输入正确的11位手机号码',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    // 模拟发送验证码
    toast({
      title: '验证码已发送',
      description: '请查看您的手机短信。',
      duration: 3000,
    });

    setCooldown(60);
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async () => {
    setIsLoading(true);

    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 在实际应用中，您会在这里处理注册
    toast({
      title: '注册成功',
      description: '您的账户已成功创建。',
      duration: 3000,
    });
    router.push('/login');

    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="px-6 py-12 space-y-6">
        <VStack className="items-center mb-8">
          <Box className="h-20 w-20 items-center justify-center rounded-full bg-primary mb-4">
            <Lock className="h-10 w-10 text-white" />
          </Box>
          <Heading size="xl" className="font-bold">
            <Text>创建账户</Text>
          </Heading>
          <Text className="text-gray-500 mt-2">注册智能门锁应用</Text>
        </VStack>

        <VStack space="lg">
          {/* 姓名 */}
          <VStack space="xs">
            <Text className="text-typography-500">姓名</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputSlot className="pl-3">
                    <InputIcon className="h-5 w-5 text-gray-400" as={User} />
                  </InputSlot>
                  <InputField
                    placeholder="请输入您的姓名"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
              )}
            />
            {errors.name && (
              <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>
            )}
          </VStack>

          {/* 手机号码 */}
          <VStack space="xs">
            <Text className="text-typography-500">手机号码</Text>
            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputSlot className="pl-3">
                    <InputIcon className="h-5 w-5 text-gray-400" as={Phone} />
                  </InputSlot>
                  <InputField
                    placeholder="请输入手机号码"
                    keyboardType="phone-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
              )}
            />
            {errors.phoneNumber && (
              <Text className="text-red-500 text-xs mt-1">{errors.phoneNumber.message}</Text>
            )}
          </VStack>

          {/* 验证码 */}
          <VStack space="xs">
            <Text className="text-typography-500">验证码</Text>
            <HStack space="sm">
              <Controller
                control={control}
                name="verificationCode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input className="flex-1">
                    <InputField
                      placeholder="请输入验证码"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                    />
                  </Input>
                )}
              />
              <Button
                variant="outline"
                onPress={handleSendVerificationCode}
                disabled={cooldown > 0}
                className="ml-2"
              >
                <ButtonText>{cooldown > 0 ? `${cooldown}s` : '发送验证码'}</ButtonText>
              </Button>
            </HStack>
            {errors.verificationCode && (
              <Text className="text-red-500 text-xs mt-1">{errors.verificationCode.message}</Text>
            )}
          </VStack>

          {/* 电子邮箱 */}
          <VStack space="xs">
            <Text className="text-typography-500">电子邮箱</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputSlot className="pl-3">
                    <InputIcon className="h-5 w-5 text-gray-400" as={Mail} />
                  </InputSlot>
                  <InputField
                    placeholder="请输入电子邮箱"
                    keyboardType="email-address"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
            )}
          </VStack>

          {/* 密码 */}
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
                    placeholder="请设置密码"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                  <InputSlot className="pr-3">
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <InputIcon
                        className="h-5 w-5 text-gray-400"
                        as={showPassword ? EyeOff : Eye}
                      />
                    </TouchableOpacity>
                  </InputSlot>
                </Input>
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>
            )}
          </VStack>

          {/* 确认密码 */}
          <VStack space="xs">
            <Text className="text-typography-500">确认密码</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input>
                  <InputSlot className="pl-3">
                    <InputIcon className="h-5 w-5 text-gray-400" as={Lock} />
                  </InputSlot>
                  <InputField
                    placeholder="请再次输入密码"
                    secureTextEntry={!showPassword}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                </Input>
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</Text>
            )}
          </VStack>

          {/* 同意条款 */}
          <VStack space="xs" className="item-center justify-center">
            <Controller
              control={control}
              name="agreeTerms"
              render={({ field: { onChange, value } }) => (
                <HStack space="sm" className="items-center">
                  <Checkbox
                    value={value ? 'checked' : 'unchecked'}
                    onChange={(state: unknown) => {
                      onChange(state);
                    }}
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                  </Checkbox>
                  <Text className="text-sm text-gray-600 flex-1">
                    我已阅读并同意
                    <Text className="text-primary" onPress={() => router.push('/')}>
                      {' '}
                      服务条款{' '}
                    </Text>
                    和
                    <Text className="text-primary" onPress={() => router.push('/')}>
                      {' '}
                      隐私政策
                    </Text>
                  </Text>
                </HStack>
              )}
            />
            {errors.agreeTerms && (
              <Text className="text-red-500 text-xs mt-1">{errors.agreeTerms.message}</Text>
            )}
          </VStack>

          {/* 注册按钮 */}
          <Button onPress={handleSubmit(onSubmit)} disabled={isLoading} className="w-full mt-4">
            <ButtonText>{isLoading ? '注册中...' : '注册'}</ButtonText>
          </Button>

          {/* 登录链接 */}
          <Box className="items-center mt-4">
            <Text className="text-sm text-gray-600">
              已有账号?{' '}
              <Text className="text-primary" onPress={() => router.push('/login')}>
                立即登录
              </Text>
            </Text>
          </Box>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
