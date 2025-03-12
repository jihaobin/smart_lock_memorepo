"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Download,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Info,
} from "lucide-react-native";
import { Link, useLocalSearchParams } from "expo-router";
import {
  Button,
  ButtonIcon,
  ButtonSpinner,
  ButtonText,
} from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogBackdrop,
  AlertDialogBody,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";

interface FirmwareInfo {
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  hasUpdate: boolean;
  features: string[];
  size: string;
  releaseNotes: string;
}

export default function FirmwareUpdate() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [firmware, setFirmware] = useState<FirmwareInfo | null>(null);
  const [updateState, setUpdateState] = useState<
    "idle" | "downloading" | "installing" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string>("");

  // 创建旋转动画值
  const spinValue = useRef(new Animated.Value(0)).current;

  // 将动画值映射到旋转角度
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Fetch device and firmware info
  const fetchDeviceInfo = async () => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock device data
      setDeviceName(id === "1" ? "前门" : id === "2" ? "后门" : `设备 ${id}`);

      // Mock firmware data
      setFirmware({
        currentVersion: "1.2.4",
        latestVersion: "1.3.0",
        releaseDate: "2023-12-15",
        hasUpdate: true,
        features: [
          "指纹识别性能提升",
          "电池寿命优化",
          "新增自定义解锁音效",
          "安全性增强",
        ],
        size: "4.2 MB",
        releaseNotes: "此更新包含多项性能改进和稳定性优化，建议所有设备升级。",
      });
    } catch (error) {
      console.error("Error fetching device info:", error);
      toast({
        title: "获取设备信息失败",
        description: "无法获取设备固件信息，请稍后再试。",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceInfo();
  }, [id, toast]);

  // 启动旋转动画 - 修改为同时处理下载和检查更新的旋转
  useEffect(() => {
    let spinAnimation: Animated.CompositeAnimation | null = null;

    if (isCheckingForUpdates || updateState === "downloading") {
      spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      // 重置动画值
      spinValue.setValue(0);
    }

    return () => {
      if (spinAnimation) {
        spinAnimation.stop();
      }
    };
  }, [isCheckingForUpdates, updateState, spinValue]);

  // Handle check for updates
  const handleCheckForUpdates = async () => {
    setIsCheckingForUpdates(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock response - already on latest version
      setFirmware((prev) => {
        if (!prev) return null;
        return { ...prev, hasUpdate: true };
      });

      toast({
        title: "检查完成",
        description: "已经检查了最新的固件版本",
      });
    } catch (error) {
      console.error("Error checking for updates:", error);
      toast({
        title: "检查更新失败",
        description: "无法检查更新，请检查网络连接后重试。",
      });
    } finally {
      setIsCheckingForUpdates(false);
    }
  };

  // Start firmware update process
  const startUpdate = async () => {
    setUpdateState("downloading");
    setProgress(0);
    setErrorMessage(null);

    try {
      // Simulate download progress
      const downloadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(downloadInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 300);

      // Simulate download completion
      setTimeout(() => {
        clearInterval(downloadInterval);
        setProgress(100);
        setUpdateState("installing");

        // Simulate installation
        setTimeout(() => {
          // 10% 失败概率
          if (Math.random() < 0.1) {
            setUpdateState("error");
            setErrorMessage("安装过程中发生错误，请重试。");
            return;
          }

          setUpdateState("success");
          setFirmware((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              currentVersion: prev.latestVersion,
              hasUpdate: false,
            };
          });
        }, 5000);
      }, 6000);
    } catch (error) {
      console.error("Update error:", error);
      setUpdateState("error");
      setErrorMessage("更新过程中发生错误，请重试。");
    }
  };

  // Handle retry after error
  const handleRetry = () => {
    setUpdateState("idle");
    setErrorMessage(null);
    setProgress(0);
  };

  // Render appropriate status message based on update state
  const renderStatusMessage = () => {
    switch (updateState) {
      case "downloading":
        return "正在下载固件更新，请确保设备保持连接和充足电量...";
      case "installing":
        return "正在安装更新，请勿关闭设备或应用程序...";
      case "success":
        return "固件已成功更新至最新版本！";
      case "error":
        return errorMessage || "更新过程中发生错误，请重试。";
      default:
        return null;
    }
  };

  return (
    <ScrollView className="flex-1 p-4 bg-gray-100">
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center">
          <Link href={`/device-management/${id}`} asChild>
            <Pressable className="mr-2">
              <ChevronLeft size={24} />
            </Pressable>
          </Link>
          <View>
            <Text className="text-xl font-bold">固件更新</Text>
            <Text className="text-sm text-gray-500">{deviceName}</Text>
          </View>
        </View>
        {firmware?.hasUpdate && updateState === "idle" && (
          <View className="bg-green-100 px-2.5 py-1 rounded-full">
            <Text className="text-xs font-medium text-green-800">
              有可用更新
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="mt-4">
          <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
            <View className="w-[120px] h-5 bg-gray-200 rounded mb-4" />
            <View className="w-[100px] h-4 bg-gray-200 rounded mb-2" />
            <View className="w-full h-4 bg-gray-200 rounded mb-2" />
            <View className="w-3/4 h-4 bg-gray-200 rounded" />
          </View>
        </View>
      ) : (
        <View className="mt-2">
          {/* Current firmware info */}
          <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
            <Text className="text-lg font-medium mb-4">当前固件信息</Text>
            <View className="mb-3">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500">当前版本</Text>
                <Text className="font-medium">{firmware?.currentVersion}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500">最新版本</Text>
                <Text className="font-medium">{firmware?.latestVersion}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500">发布日期</Text>
                <Text className="font-medium">{firmware?.releaseDate}</Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-500">状态</Text>
                <Text
                  className={`font-medium ${
                    firmware?.hasUpdate ? "text-primary" : "text-success-500"
                  }`}
                >
                  {firmware?.hasUpdate ? "可更新" : "已是最新"}
                </Text>
              </View>
            </View>

            <Button
              variant="outline"
              className="w-full mt-4"
              onPress={handleCheckForUpdates}
              disabled={isCheckingForUpdates}
            >
              {isCheckingForUpdates ? (
                <ButtonSpinner className="text-primary" />
              ) : (
                <ButtonIcon
                  as={RefreshCw}
                  className={`mr-1 ${
                    isCheckingForUpdates ? "animate-spin" : ""
                  }`}
                />
              )}
              <ButtonText>
                {isCheckingForUpdates ? "检查中..." : "检查更新"}
              </ButtonText>
            </Button>
          </View>

          {/* Update details (if update available) */}
          {firmware?.hasUpdate && updateState === "idle" && (
            <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
              <Text className="text-lg font-medium mb-4">可用更新</Text>
              <View className="mb-4">
                <View className="mb-4">
                  <Text className="text-gray-500 mb-2">新功能和改进</Text>
                  <View className="mt-1">
                    {firmware.features.map((feature, index) => (
                      <View key={index} className="mb-1">
                        <Text className="text-sm">• {feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className="flex-row justify-between mb-3">
                  <Text className="text-gray-500">更新大小</Text>
                  <Text className="font-medium">{firmware.size}</Text>
                </View>
                <View className="mt-2">
                  <Text className="text-gray-500 mb-2">更新说明</Text>
                  <Text className="text-sm">{firmware.releaseNotes}</Text>
                </View>
              </View>

              <Button
                className="w-full mt-6"
                onPress={() => setShowConfirmDialog(true)}
              >
                <ButtonIcon as={Download} className="mr-1" />
                <ButtonText className="text-white font-medium">
                  开始更新
                </ButtonText>
              </Button>
            </View>
          )}

          {/* Update progress section */}
          {(updateState === "downloading" || updateState === "installing") && (
            <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
              <Text className="text-lg font-medium mb-4">
                {updateState === "downloading" ? "下载更新" : "安装更新"}
              </Text>

              <View className="mt-2">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    {updateState === "downloading" && (
                      <Animated.View
                        style={{
                          transform: [{ rotate: spin }],
                          marginRight: 4,
                        }}
                      >
                        <RefreshCw size={14} color="#0891b2" />
                      </Animated.View>
                    )}
                    <Text className="text-sm font-medium text-primary">
                      {updateState === "downloading"
                        ? `下载中 (${progress}%)`
                        : "安装中"}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500">
                    {updateState === "downloading"
                      ? `${firmware?.size}`
                      : "请勿关闭设备"}
                  </Text>
                </View>

                <View className="mb-4">
                  {updateState === "downloading" && (
                    <View className="w-full bg-gray-50 h-1 mt-1 rounded-full overflow-hidden">
                      <View
                        className="bg-primary-100 rounded-full h-10"
                        style={{ width: `${progress}%`, opacity: 0.5 }}
                      />
                    </View>
                  )}
                </View>

                <View className="bg-gray-50 p-3 rounded-md">
                  <Text className="text-sm text-gray-600">
                    {renderStatusMessage()}
                  </Text>
                  {updateState === "downloading" && (
                    <View className="flex-row justify-between mt-2">
                      <Text className="text-xs text-gray-500">
                        已下载:{" "}
                        {(
                          (parseFloat(firmware?.size || "0") * progress) /
                          100
                        ).toFixed(1)}{" "}
                        MB
                      </Text>
                      <Text className="text-xs text-gray-500">
                        剩余:{" "}
                        {(
                          (parseFloat(firmware?.size || "0") *
                            (100 - progress)) /
                          100
                        ).toFixed(1)}{" "}
                        MB
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Success section */}
          {updateState === "success" && (
            <View className="bg-white rounded-lg p-6 mb-4 border border-gray-200">
              <View className="items-center py-4">
                <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
                  <CheckCircle size={32} color="#16a34a" />
                </View>
                <Text className="text-xl font-medium text-green-600 mb-2">
                  更新成功
                </Text>
                <Text className="text-sm text-gray-500 text-center mb-6">
                  您的设备已成功更新至最新固件版本 {firmware?.currentVersion}
                </Text>
                <Button
                  className="w-full"
                  onPress={() =>
                    router.push({
                      pathname: "/device-management/[id]",
                      params: { id: id as string },
                    })
                  }
                >
                  <ButtonIcon as={ArrowRight} className="mr-2" />
                  <ButtonText className="text-white font-medium">
                    返回设备管理
                  </ButtonText>
                </Button>
              </View>
            </View>
          )}

          {/* Error section */}
          {updateState === "error" && (
            <View className="bg-red-50 rounded-lg p-6 mb-4 border border-red-100">
              <View className="items-center py-4">
                <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                  <AlertTriangle size={32} color="#dc2626" />
                </View>
                <Text className="text-xl font-medium text-red-600 mb-2">
                  更新失败
                </Text>
                <Text className="text-sm text-red-600 text-center mb-6">
                  {errorMessage || "更新过程中发生错误，请重试。"}
                </Text>
                <VStack className="w-full space-y-3 gap-2">
                  <Button className="w-full" onPress={handleRetry}>
                    <ButtonIcon as={RefreshCw} className="mr-2" />
                    <ButtonText className="text-white font-medium">
                      重试
                    </ButtonText>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onPress={() => router.push(`/device-management/${id}`)}
                  >
                    <ButtonText className="text-primary font-medium">
                      返回设备管理
                    </ButtonText>
                  </Button>
                </VStack>
              </View>
            </View>
          )}

          {/* Guide/Help section */}
          <View className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
            <View className="flex-row gap-2">
              <Info size={20} color="#1e40af" className="mt-0.5 mr-3" />
              <View className="flex-1">
                <Text className="text-sm font-medium text-blue-800 mb-1">
                  固件更新指南
                </Text>
                <View>
                  <Text className="text-xs text-blue-800 mb-1">
                    • 更新过程中请确保设备电量充足（建议高于50%）
                  </Text>
                  <Text className="text-xs text-blue-800 mb-1">
                    • 更新期间请勿断开设备连接或关闭应用
                  </Text>
                  <Text className="text-xs text-blue-800 mb-1">
                    • 更新完成后设备可能会自动重启
                  </Text>
                  <Text className="text-xs text-blue-800 mb-1">
                    • 如果多次更新失败，请联系客服支持
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <AlertDialogBackdrop />
        <AlertDialogContent>
          <AlertDialogHeader>
            <Heading size="md" className="font-semibold">
              确认更新固件
            </Heading>
          </AlertDialogHeader>
          <AlertDialogBody>
            <Text className="text-sm text-gray-500 mt-2">
              您将更新 {deviceName} 的固件从 {firmware?.currentVersion} 到{" "}
              {firmware?.latestVersion}。
              更新过程中设备将暂时无法使用，请确保您现在不需要使用该设备，且设备电量充足。
            </Text>
          </AlertDialogBody>
          <AlertDialogFooter className="flex-row justify-between mt-4">
            <Button
              variant="outline"
              onPress={() => setShowConfirmDialog(false)}
              className="mr-2"
            >
              <ButtonText>取消</ButtonText>
            </Button>
            <Button
              onPress={() => {
                setShowConfirmDialog(false);
                startUpdate();
              }}
              className="bg-primary"
            >
              <ButtonText className="text-white">确认更新</ButtonText>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  );
}
