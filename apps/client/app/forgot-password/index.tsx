import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Mail, ArrowRight, Phone } from 'lucide-react-native';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView, TouchableOpacity } from 'react-native';
import { z } from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';

// 定义表单验证schema
const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的电子邮箱').min(1, '邮箱不能为空'),
  verificationCode: z
    .string()
    .min(4, '验证码至少需要4位')
    .max(6, '验证码最多6位')
    .regex(/^\d+$/, '验证码只能包含数字'),
});

// 定义表单数据类型
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  // 初始化 react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      verificationCode: '',
    },
  });

  // 监听邮箱值变化
  const email = watch('email');

  const handleSendVerificationCode = () => {
    if (cooldown > 0) return;

    // 验证邮箱格式
    const emailValue = getValues('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailValue || !emailRegex.test(emailValue)) {
      toast({
        title: '邮箱格式错误',
        description: '请输入正确的邮箱',
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

    // 在实际应用中，您会在这里处理密码重置
    setIsSubmitted(true);
    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="px-6 py-12 space-y-6">
        {!isSubmitted ? (
          <>
            <Text className="text-gray-600 mb-6">
              请输入您注册时使用的手机号码，我们将向您发送验证码。
            </Text>

            <VStack space="md">
              <VStack space="xs">
                <Text className="text-typography-500">手机号码</Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input>
                      <InputSlot className="pl-3">
                        <InputIcon className="h-5 w-5 text-gray-400" as={Phone}></InputIcon>
                      </InputSlot>
                      <InputField
                        placeholder="请输入邮箱"
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
                  <Text className="text-red-500 text-xs mt-1">
                    {errors.verificationCode.message}
                  </Text>
                )}
              </VStack>

              <Button onPress={handleSubmit(onSubmit)} disabled={isLoading} className="w-full mt-4">
                <ButtonText>{isLoading ? '提交中...' : '重置密码'}</ButtonText>
              </Button>

              <Box className="items-center mt-4">
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text className="text-primary">返回登录</Text>
                </TouchableOpacity>
              </Box>
            </VStack>
          </>
        ) : (
          <VStack className="items-center py-8 space-y-4">
            <Box className="h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
              <Mail className="h-8 w-8 text-green-600" />
            </Box>
            <Heading size="lg" className="font-bold mb-2">
              <Text>验证码已发送</Text>
            </Heading>
            <Text className="text-gray-600 text-center mb-6">
              我们已向 {email} 发送了一条包含验证码的短信。请输入短信中的验证码以重置您的密码。
            </Text>
            <VStack space="md" className="w-full">
              <Button variant="outline" onPress={() => setIsSubmitted(false)} className="w-full">
                <ButtonText>重新发送</ButtonText>
              </Button>
              <Button onPress={() => router.push('/login')} className="w-full">
                <HStack space="xs" className="items-center">
                  <ButtonText>返回登录</ButtonText>
                  <ArrowRight className="h-4 w-4 text-white" />
                </HStack>
              </Button>
            </VStack>
          </VStack>
        )}
      </VStack>
    </ScrollView>
  );
}
