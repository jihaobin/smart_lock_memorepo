import React from "react";
import { useState } from "react";
import { Lock, Phone } from "lucide-react-native";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useRouter, Stack } from "expo-router";
import { Text } from "@/components/ui/text";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { EyeIcon, EyeOffIcon, CheckIcon, Icon } from "@/components/ui/icon";
import { Heading } from "@/components/ui/heading";

// 定义表单验证schema
const loginSchema = z.object({
  phoneNumber: z
    .string()
    .min(11, "手机号必须是11位")
    .max(11, "手机号必须是11位"),
  password: z.string().min(6, "密码至少6位字符"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();
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
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phoneNumber: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleTogglePassword = () => {
    setShowPassword((prevState) => !prevState);
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    // 模拟API调用的延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 预设的正确手机号和密码
    const correctPhone = "13800138000";
    const correctPassword = "password123";

    if (
      data.phoneNumber === correctPhone &&
      data.password === correctPassword
    ) {
      login({
        id: "1",
        name: "测试用户",
        email: "test@example.com",
        phone: data.phoneNumber,
      });
      toast({
        title: "登录成功",
        description: "欢迎回来，测试用户！",
        duration: 3000,
      });
      router.push("/");
    } else {
      toast({
        title: "登录失败",
        description: "手机号或密码错误，请重试。",
        variant: "destructive",
        duration: 3000,
      });
    }

    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <VStack className="px-6 py-12 space-y-8">
        <VStack className="items-center space-y-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-primary">
            <Icon as={Lock} className="h-10 w-10 text-white"></Icon>
          </View>
          <Heading size="xl" className="font-bold">
            智能门锁
          </Heading>
          <Text className="text-gray-500">安全便捷的智能家居解决方案</Text>
        </VStack>

        <VStack space="md" className="space-y-6">
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
              <Text className="text-error-500 text-xs">
                {errors.phoneNumber.message}
              </Text>
            )}
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
                    type={showPassword ? "text" : "password"}
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
              <Text className="text-error-500 text-xs">
                {errors.password.message}
              </Text>
            )}
          </VStack>

          <HStack className="justify-between items-center">
            <Controller
              control={control}
              name="rememberMe"
              render={({ field: { onChange, value } }) => (
                <Checkbox
                  value="rememberMe"
                  isChecked={value}
                  onChange={onChange}
                  size="md"
                >
                  <CheckboxIndicator>
                    <CheckboxIcon as={CheckIcon} />
                  </CheckboxIndicator>
                  <CheckboxLabel className="text-gray-600">
                    记住我
                  </CheckboxLabel>
                </Checkbox>
              )}
            />
            <TouchableOpacity onPress={() => router.push("/forgot-password")}>
              <Text className="text-primary">忘记密码?</Text>
            </TouchableOpacity>
          </HStack>

          <Button
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            className="w-full mt-4"
          >
            <ButtonText>{isLoading ? "登录中..." : "登录"}</ButtonText>
          </Button>

          <View className="items-center mt-4">
            <Text className="text-gray-600">
              还没有账号?{" "}
              <Text
                className="text-primary"
                onPress={() => router.push("/register")}
              >
                立即注册
              </Text>
            </Text>
          </View>
        </VStack>

        <VStack className="mt-8 space-y-6">
          <View className="relative py-4">
            <View className="absolute inset-y-1/2 w-full h-px bg-gray-300" />
            <View className="relative flex justify-center items-center">
              <Text className="bg-white px-4 text-gray-500">其他登录方式</Text>
            </View>
          </View>

          <HStack className="justify-between space-x-4">
            <Button variant="outline" className="flex-1">
              <ButtonIcon>
                <svg
                  className="h-5 w-5 text-[#07C160]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8.69 13.09c-.4 0-.72-.32-.72-.72s.32-.72.72-.72.72.32.72.72-.32.72-.72.72zm4.8-2.16c.4 0 .72.32.72.72s-.32.72-.72.72-.72-.32-.72-.72.32-.72.72-.72zm-4.8-2.16c-.4 0-.72-.32-.72-.72s.32-.72.72-.72.72.32.72.72-.32.72-.72.72zm4.8-2.16c.4 0 .72.32.72.72s-.32.72-.72.72-.72-.32-.72-.72.32-.72.72-.72zM12 22.5C6.201 22.5 1.5 17.799 1.5 12S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5zm-.96-15.12c-3.36 0-6.24 2.16-6.24 4.92 0 1.44.72 2.76 1.92 3.6l-.48 1.56 1.8-.96c.48.12 1.08.24 1.56.24.12 0 .24 0 .36-.12-.12-.36-.12-.72-.12-1.08 0-2.52 2.4-4.56 5.52-4.56.12 0 .36 0 .48.12-.84-2.04-3-3.72-5.76-3.72h-.04zm8.4 6.12c0-2.04-2.04-3.72-4.44-3.72-2.52 0-4.44 1.68-4.44 3.72s1.92 3.72 4.44 3.72c.48 0 1.08-.12 1.56-.24l1.44.84-.36-1.2c.96-.72 1.8-1.8 1.8-3.12z" />
                </svg>
              </ButtonIcon>
            </Button>
            <Button variant="outline" className="flex-1">
              <ButtonIcon>
                <svg
                  className="h-5 w-5 text-[#1677FF]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 22.5c-5.799 0-10.5-4.701-10.5-10.5S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5zm4.56-8.88v.12c-.48 2.04-3.36 3.48-5.52 3.48-1.2 0-2.16-.36-2.4-.96-.12-.36 0-.72.36-1.08.24-.24.6-.36.96-.36h.12c.24 0 .48.12.6.24.24.24.48.36.84.36.96 0 2.04-.84 2.64-1.56-1.08-.48-2.28-.96-3.6-1.44-1.32.6-3.12 1.32-3.12 2.88 0 1.08 1.2 1.8 2.4 1.8 1.08 0 2.04-.36 2.88-.96l.12.12c-.24.36-.6.72-1.08.96-.48.24-1.08.36-1.8.36-1.8 0-3.24-1.08-3.24-2.64 0-1.8 2.04-2.88 3.84-3.6-1.8-.84-3-2.4-3-4.32 0-2.4 2.16-4.44 5.04-4.44 2.88 0 5.04 2.04 5.04 4.44 0 1.92-1.2 3.48-3 4.32 1.8.72 3.84 1.8 3.84 3.6zm-5.52-7.92c-1.44 0-2.64 1.2-2.64 2.64s1.2 2.64 2.64 2.64 2.64-1.2 2.64-2.64-1.2-2.64-2.64-2.64z" />
                </svg>
              </ButtonIcon>
            </Button>
            <Button variant="outline" className="flex-1">
              <ButtonIcon>
                <svg
                  className="h-5 w-5 text-[#00A4FF]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 22.5c-5.799 0-10.5-4.701-10.5-10.5S6.201 1.5 12 1.5 22.5 6.201 22.5 12 17.799 22.5 12 22.5zm0-18.75c-4.549 0-8.25 3.701-8.25 8.25s3.701 8.25 8.25 8.25 8.25-3.701 8.25-8.25S16.549 3.75 12 3.75zm-1.5 12.75v-7.5h3v7.5h-3zm0-9v-1.5h3V7.5h-3z" />
                </svg>
              </ButtonIcon>
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </ScrollView>
  );
}
