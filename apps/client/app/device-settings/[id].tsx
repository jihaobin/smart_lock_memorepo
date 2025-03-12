import React, { useState, useEffect, useCallback } from "react";
import { ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Bell,
  Lock,
  AlertTriangle,
  Key,
  BatteryLow,
  DoorOpen,
  Volume2,
  Clock,
  Wifi,
  Bluetooth,
  Camera,
  Fingerprint,
  CheckCheck,
  Circle,
  ChevronDown,
  Check,
} from "lucide-react-native";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Slider from "@react-native-community/slider";

import { Button, ButtonText } from "@/components/ui/button";
import { Input, InputField } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress, ProgressFilledTrack } from "@/components/ui/progress";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
  RadioLabel,
} from "@/components/ui/radio";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Pressable } from "@/components/ui/pressable";
import { Text } from "@/components/ui/text";
import { CircleIcon, Icon } from "@/components/ui/icon";
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionIcon,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Divider } from "@/components/ui/divider";
import { useToast } from "@/hooks/use-toast";

// 设置项颜色配置
const COLORS = {
  general: "#3b82f6", // 蓝色
  lock: "#6b7280", // 灰色
  connection: "#10b981", // 绿色
  tamperAlert: "#ef4444", // 红色
  wrongPasswordAlert: "#f59e0b", // 橙色
  lowBatteryAlert: "#f97316", // 橙红色
  doorOpenAlert: "#8b5cf6", // 紫色
  capturePhoto: "#ec4899", // 粉色
  fingerprintAuth: "#0ea5e9", // 天蓝色
  switchActive: "#ef4444", // 绿色，与connection一致
  notification: "#3b82f6", // 蓝色
};

// 定义设备设置的Schema
const settingsSchema = z.object({
  name: z.string().min(3, { message: "设备名称至少需要3个字符" }),
  volume: z.number().min(0).max(100),
  notifications: z.boolean(),
  autoLock: z.boolean(),
  autoLockDelay: z.number().min(5).max(60),
  connectionMode: z.enum(["wifi", "bluetooth"]),
  tamperAlert: z.boolean(),
  wrongPasswordAlert: z.boolean(),
  lowBatteryAlert: z.boolean(),
  doorOpenAlert: z.boolean(),
  capturePhoto: z.boolean(),
  fingerprintVerification: z.boolean(),
});

// 定义表单数据类型
type SettingsFormData = z.infer<typeof settingsSchema>;

// 设置项骨架屏组件
const SettingItemSkeleton = () => (
  <Box className="px-4 py-4 border-b border-gray-100">
    <HStack className="justify-between items-center">
      <HStack className="items-center space-x-3">
        <Box className="w-8 h-8 rounded-full bg-gray-200" />
        <VStack>
          <Box className="w-24 h-4 bg-gray-200 rounded" />
          <Box className="w-36 h-3 bg-gray-100 rounded mt-1" />
        </VStack>
      </HStack>
      <Box className="w-10 h-6 bg-gray-200 rounded-full" />
    </HStack>
  </Box>
);

// 设置分类骨架屏组件
const SettingCategorySkeleton = () => (
  <Box className="mb-4">
    <Box className="px-4 py-3 bg-white border-b border-gray-200">
      <Box className="w-24 h-5 bg-gray-200 rounded" />
    </Box>
    <Box className="bg-white">
      <SettingItemSkeleton />
      <SettingItemSkeleton />
      <SettingItemSkeleton />
    </Box>
  </Box>
);

export default function DeviceSettings() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 添加本地状态用于实时显示拖动值
  const [volumeDisplay, setVolumeDisplay] = useState(70);
  const [delayDisplay, setDelayDisplay] = useState(30);

  // 使用react-hook-form初始化表单
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      volume: 70,
      notifications: true,
      autoLock: true,
      autoLockDelay: 30,
      connectionMode: "wifi",
      tamperAlert: true,
      wrongPasswordAlert: true,
      lowBatteryAlert: true,
      doorOpenAlert: true,
      capturePhoto: true,
      fingerprintVerification: true,
    },
  });

  // 监听autoLock的值
  const autoLock = watch("autoLock");
  const volume = watch("volume");
  const autoLockDelay = watch("autoLockDelay");

  // 当表单值变化时同步显示值
  useEffect(() => {
    setVolumeDisplay(volume);
  }, [volume]);

  useEffect(() => {
    setDelayDisplay(autoLockDelay);
  }, [autoLockDelay]);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 设置表单初始值
      setValue("name", `Smart Lock ${id}`);
      setValue("volume", 70);
      setValue("notifications", true);
      setValue("autoLock", true);
      setValue("autoLockDelay", 30);
      setValue("connectionMode", "wifi");
      setValue("tamperAlert", true);
      setValue("wrongPasswordAlert", true);
      setValue("lowBatteryAlert", true);
      setValue("doorOpenAlert", true);
      setValue("capturePhoto", true);
      setValue("fingerprintVerification", true);

      setIsLoading(false);
    };

    fetchSettings();
  }, [id, setValue]);

  const onSubmit = async (data: SettingsFormData) => {
    setIsSaving(true);
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("保存的设置:", data);
    setIsSaving(false);

    toast({
      title: "设置已保存",
      description: "您的设备设置已成功更新。",
      variant: "success",
      duration: 3000,
    });
  };

  if (isLoading) {
    return (
      <Box className="flex-1 bg-gray-50">
        <ScrollView className="flex-1">
          <Box className="mt-4 mx-4 mb-8">
            <SettingCategorySkeleton />
            <SettingCategorySkeleton />
            <SettingCategorySkeleton />
            <Box className="mt-6 h-12 bg-gray-200 rounded-md" />
            <Box className="mt-4 h-12 bg-gray-200 rounded-md" />
            <Box className="mt-4 h-12 bg-gray-200 rounded-md" />
          </Box>
        </ScrollView>
      </Box>
    );
  }

  return (
    <Box className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <Box className="mt-4 mx-4 mb-8">
          <Accordion type="multiple" defaultValue={["通用设置"]}>
            {/* 通用设置 */}
            <AccordionItem value="通用设置" className="mb-1">
              <AccordionHeader className="bg-white border-b border-gray-200">
                <AccordionTrigger>
                  <HStack className="items-center justify-between w-full px-4 py-3">
                    <Text className="font-bold text-base">通用设置</Text>
                    <AccordionIcon as={ChevronDown} />
                  </HStack>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="bg-white">
                <Box>
                  {/* 设备名称 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <VStack>
                      <Text className="font-medium mb-2">设备名称</Text>
                      <Controller
                        control={control}
                        name="name"
                        render={({ field: { onChange, value } }) => (
                          <Input>
                            <InputField
                              value={value}
                              onChangeText={onChange}
                              placeholder="输入设备名称"
                            />
                          </Input>
                        )}
                      />
                    </VStack>
                  </Box>

                  {/* 音量 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <VStack>
                      <Text className="font-medium mb-2">音量</Text>
                      <HStack className="items-center space-x-2 gap-2">
                        <Box
                          style={{ backgroundColor: `${COLORS.tamperAlert}20` }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={Volume2}
                            size="sm"
                            color={COLORS.tamperAlert}
                          />
                        </Box>
                        <Box className="flex-1">
                          <Controller
                            control={control}
                            name="volume"
                            render={({ field: { value, onChange } }) => (
                              <Slider
                                style={{ width: "100%", height: 40 }}
                                value={value}
                                minimumValue={0}
                                maximumValue={100}
                                step={5}
                                minimumTrackTintColor="#ef4444"
                                maximumTrackTintColor="#eab308"
                                thumbTintColor="white"
                                // 拖动时更新显示值
                                onValueChange={(val) =>
                                  setVolumeDisplay(Math.round(val))
                                }
                                // 拖动完成时更新表单值
                                onSlidingComplete={onChange}
                              />
                            )}
                          />
                        </Box>
                        <Text className="text-sm text-gray-500 min-w-[40px] text-right">
                          {volumeDisplay}%
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>

                  {/* 通知 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{
                            backgroundColor: `${COLORS.notification}20`,
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={Bell}
                            size="sm"
                            color={COLORS.notification}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">通知</Text>
                          <Text className="text-xs text-gray-500">
                            接收设备状态和警报通知
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="notifications"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>
                </Box>
              </AccordionContent>
            </AccordionItem>

            {/* 锁定设置 */}
            <AccordionItem value="锁定设置" className="mb-1">
              <AccordionHeader className="bg-white border-b border-gray-200">
                <AccordionTrigger>
                  <HStack className="items-center justify-between w-full px-4 py-3">
                    <Text className="font-bold text-base">锁定设置</Text>
                    <AccordionIcon as={ChevronDown} />
                  </HStack>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="bg-white">
                <Box>
                  {/* 自动锁定 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{ backgroundColor: `${COLORS.lock}20` }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon as={Lock} size="sm" color={COLORS.lock} />
                        </Box>
                        <VStack>
                          <Text className="font-medium">自动锁定</Text>
                          <Text className="text-xs text-gray-500">
                            开门后自动锁定门锁
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="autoLock"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>

                  {/* 自动锁定延迟 */}
                  {autoLock && (
                    <Box className="px-4 py-4">
                      <VStack>
                        <Text className="font-medium mb-2">自动锁定延迟</Text>
                        <HStack className="items-center space-x-2">
                          <Box
                            style={{ backgroundColor: `${COLORS.lock}20` }}
                            className="w-8 h-8 rounded-full items-center justify-center"
                          >
                            <Icon as={Clock} size="sm" color={COLORS.lock} />
                          </Box>
                          <Box className="flex-1">
                            <Controller
                              control={control}
                              name="autoLockDelay"
                              render={({ field: { value, onChange } }) => (
                                <Slider
                                  style={{ width: "100%", height: 40 }}
                                  value={value}
                                  minimumValue={5}
                                  maximumValue={60}
                                  step={5}
                                  minimumTrackTintColor="#ef4444"
                                  maximumTrackTintColor="#eab308"
                                  thumbTintColor="white"
                                  // 拖动时更新显示值
                                  onValueChange={(val) =>
                                    setDelayDisplay(Math.round(val))
                                  }
                                  // 拖动完成时更新表单值
                                  onSlidingComplete={onChange}
                                />
                              )}
                            />
                          </Box>
                          <Text className="text-sm text-gray-500 min-w-[50px] text-right">
                            {delayDisplay} 秒
                          </Text>
                        </HStack>
                      </VStack>
                    </Box>
                  )}
                </Box>
              </AccordionContent>
            </AccordionItem>

            {/* 连接设置 */}
            <AccordionItem value="连接设置" className="mb-1">
              <AccordionHeader className="bg-white border-b border-gray-200">
                <AccordionTrigger>
                  <HStack className="items-center justify-between w-full px-4 py-3">
                    <Text className="font-bold text-base">连接设置</Text>
                    <AccordionIcon as={ChevronDown} />
                  </HStack>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="bg-white">
                <Box>
                  {/* 连接模式 */}
                  <Box className="px-4 py-4">
                    <VStack>
                      <Text className="font-medium mb-2">连接模式</Text>
                      <Controller
                        control={control}
                        name="connectionMode"
                        render={({ field: { onChange, value } }) => (
                          <RadioGroup value={value} onChange={onChange}>
                            <HStack className="items-center space-x-2 mb-3">
                              <Radio value="wifi">
                                <RadioIndicator>
                                  <RadioIcon as={CircleIcon} />
                                </RadioIndicator>
                                <RadioLabel className="ml-2">
                                  <HStack className="items-center space-x-2 gap-2">
                                    <Box
                                      style={{
                                        backgroundColor: `${COLORS.connection}20`,
                                      }}
                                      className="w-8 h-8 rounded-full items-center justify-center"
                                    >
                                      <Icon
                                        as={Wifi}
                                        size="sm"
                                        color={COLORS.connection}
                                      />
                                    </Box>
                                    <Text>WiFi</Text>
                                  </HStack>
                                </RadioLabel>
                              </Radio>
                            </HStack>
                            <HStack className="items-center space-x-2">
                              <Radio value="bluetooth">
                                <RadioIndicator>
                                  <RadioIcon as={CircleIcon} />
                                </RadioIndicator>
                                <RadioLabel className="ml-2">
                                  <HStack className="items-center space-x-2 gap-2">
                                    <Box
                                      style={{
                                        backgroundColor: `${COLORS.connection}20`,
                                      }}
                                      className="w-8 h-8 rounded-full items-center justify-center"
                                    >
                                      <Icon
                                        as={Bluetooth}
                                        size="sm"
                                        color={COLORS.connection}
                                      />
                                    </Box>
                                    <Text>蓝牙</Text>
                                  </HStack>
                                </RadioLabel>
                              </Radio>
                            </HStack>
                          </RadioGroup>
                        )}
                      />
                    </VStack>
                  </Box>
                </Box>
              </AccordionContent>
            </AccordionItem>

            {/* 安全设置 */}
            <AccordionItem value="安全设置" className="mb-1">
              <AccordionHeader className="bg-white border-b border-gray-200">
                <AccordionTrigger>
                  <HStack className="items-center justify-between w-full px-4 py-3">
                    <Text className="font-bold text-base">安全设置</Text>
                    <AccordionIcon as={ChevronDown} />
                  </HStack>
                </AccordionTrigger>
              </AccordionHeader>
              <AccordionContent className="bg-white">
                <Box>
                  {/* 防拆警报 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{ backgroundColor: `${COLORS.tamperAlert}20` }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={AlertTriangle}
                            size="sm"
                            color={COLORS.tamperAlert}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">防拆警报</Text>
                          <Text className="text-xs text-gray-500">
                            当检测到门锁被拆卸时发出警报
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="tamperAlert"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>

                  {/* 密码错误警报 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{
                            backgroundColor: `${COLORS.wrongPasswordAlert}20`,
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={Key}
                            size="sm"
                            color={COLORS.wrongPasswordAlert}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">密码错误警报</Text>
                          <Text className="text-xs text-gray-500">
                            连续输入错误密码时发出警报
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="wrongPasswordAlert"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>

                  {/* 电量低警报 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{
                            backgroundColor: `${COLORS.lowBatteryAlert}20`,
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={BatteryLow}
                            size="sm"
                            color={COLORS.lowBatteryAlert}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">电量低警报</Text>
                          <Text className="text-xs text-gray-500">
                            当电池电量低于20%时通知
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="lowBatteryAlert"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>

                  {/* 门开启通知 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{
                            backgroundColor: `${COLORS.doorOpenAlert}20`,
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={DoorOpen}
                            size="sm"
                            color={COLORS.doorOpenAlert}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">门开启通知</Text>
                          <Text className="text-xs text-gray-500">
                            当门被打开时发送通知
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="doorOpenAlert"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>

                  {/* 拍摄访客照片 */}
                  <Box className="px-4 py-4 border-b border-gray-100">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{
                            backgroundColor: `${COLORS.capturePhoto}20`,
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={Camera}
                            size="sm"
                            color={COLORS.capturePhoto}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">拍摄访客照片</Text>
                          <Text className="text-xs text-gray-500">
                            当有人使用密码或临时密码开门时拍照
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="capturePhoto"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>

                  {/* 指纹验证 */}
                  <Box className="px-4 py-4">
                    <HStack className="justify-between items-center">
                      <HStack className="items-center space-x-3 gap-2">
                        <Box
                          style={{
                            backgroundColor: `${COLORS.fingerprintAuth}20`,
                          }}
                          className="w-8 h-8 rounded-full items-center justify-center"
                        >
                          <Icon
                            as={Fingerprint}
                            size="sm"
                            color={COLORS.fingerprintAuth}
                          />
                        </Box>
                        <VStack>
                          <Text className="font-medium">指纹验证</Text>
                          <Text className="text-xs text-gray-500">
                            使用指纹进行身份验证
                          </Text>
                        </VStack>
                      </HStack>
                      <Controller
                        control={control}
                        name="fingerprintVerification"
                        render={({ field: { onChange, value } }) => (
                          <Switch
                            trackColor={{
                              false: "#d1d5db",
                              true: COLORS.switchActive,
                            }}
                            thumbColor={value ? "#ffffff" : "#f3f4f6"}
                            value={value}
                            onValueChange={onChange}
                          />
                        )}
                      />
                    </HStack>
                  </Box>
                </Box>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button
            onPress={handleSubmit(onSubmit)}
            isDisabled={isSaving}
            className="w-full bg-red-500 mt-6"
          >
            {isSaving ? (
              <HStack space="sm" className="items-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <ButtonText>保存中...</ButtonText>
              </HStack>
            ) : (
              <HStack space="sm" className="items-center">
                <Icon as={Check} size="sm" color="#ffffff" />
                <ButtonText>保存设置</ButtonText>
              </HStack>
            )}
          </Button>

          {/* 固件更新按钮 */}
          <Button
            onPress={() =>
              router.push({
                pathname: "/firmware-update/[id]",
                params: { id: id as string },
              })
            }
            className="w-full bg-white border border-gray-200 mt-4"
          >
            <ButtonText className="text-gray-800">固件更新</ButtonText>
          </Button>

          {/* 恢复出厂设置按钮 */}
          <Button
            onPress={() =>
              router.push({
                pathname: "/factory-reset/[id]",
                params: { id: id as string },
              })
            }
            className="w-full bg-red-50 mt-4"
          >
            <ButtonText className="text-red-500">恢复出厂设置</ButtonText>
          </Button>
        </Box>
      </ScrollView>
    </Box>
  );
}
