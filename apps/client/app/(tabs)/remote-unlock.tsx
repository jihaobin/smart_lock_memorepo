import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import { Camera, ChevronLeft, User, Clock, Check } from "lucide-react-native";
import { Link, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Button, ButtonText } from "@/components/ui/button";
import { ChevronDownIcon, Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from "@/components/ui/select";

interface Device {
  id: number;
  name: string;
  lastUpdate: string;
  image: string;
}

export default function RemoteUnlock() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // 模拟从API获取设备列表
    const fetchedDevices: Device[] = [
      { id: 1, name: "前门", lastUpdate: "刚刚", image: "https://via.placeholder.com/400x300" },
      { id: 2, name: "后门", lastUpdate: "5分钟前", image: "https://via.placeholder.com/400x300" },
      { id: 3, name: "车库门", lastUpdate: "10分钟前", image: "https://via.placeholder.com/400x300" },
    ];
    setDevices(fetchedDevices);
    setSelectedDevice(fetchedDevices[0]);
    setSelectedDeviceId(fetchedDevices[0].id.toString());
  }, []);

  useEffect(() => {
    // 当选择的设备ID变化时，更新selectedDevice
    const device = devices.find(d => d.id.toString() === selectedDeviceId);
    if (device) {
      setSelectedDevice(device);
    }
  }, [selectedDeviceId, devices]);

  const handleUnlock = () => {
    setUnlocking(true);
    // 模拟API调用
    setTimeout(() => {
      setUnlocking(false);
      setUnlocked(true);
      setTimeout(() => {
        setUnlocked(false);
        setShowConfirmation(false);
      }, 3000);
    }, 2000);
  };

  const recentVisitors = [
    { id: 1, name: "张三", time: "今天 12:45", device: "前门" },
    { id: 2, name: "李四", time: "今天 10:30", device: "后门" },
    { id: 3, name: "王五", time: "昨天 18:22", device: "车库门" },
  ];

  return (
    <ScrollView className="flex-1 bg-background">
      <VStack className="px-4 py-6 gap-4">

        <View className="rounded-xl overflow-hidden border border-border shadow-sm bg-card">
          <View className="aspect-video relative">
            {showConfirmation ? (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                {unlocking && (
                  <VStack className="items-center space-y-4">
                    <Spinner size="large" color="white" />
                    <Text className="text-lg font-medium text-white">正在开锁...</Text>
                  </VStack>
                )}
                {unlocked && (
                  <VStack className="items-center space-y-4">
                    <View className="h-16 w-16 rounded-full bg-green-500 items-center justify-center">
                      <Icon as={Check} className="h-8 w-8 text-white" />
                    </View>
                    <Text className="text-lg font-medium text-white">开锁成功</Text>
                  </VStack>
                )}
                {!unlocking && !unlocked && (
                  <VStack className="items-center space-y-4">
                    <Text className="text-lg font-medium text-white mb-2">
                      确认远程开锁 {selectedDevice?.name}?
                    </Text>
                    <HStack className="space-x-4">
                      <Button
                        onPress={() => setShowConfirmation(false)}
                        className="bg-gray-600"
                      >
                        <ButtonText className="text-white px-4">取消</ButtonText>
                      </Button>
                      <Button onPress={handleUnlock}>
                        <ButtonText className="px-4">确认</ButtonText>
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: selectedDevice?.image || "https://via.placeholder.com/400x300" }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
                <View className="absolute bottom-4 right-4">
                  <TouchableOpacity className="h-12 w-12 rounded-full bg-white/70 items-center justify-center">
                    <Icon as={Camera} className="h-6 w-6 text-gray-800" />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
          <VStack className="p-4 bg-white">
            <Select
              selectedValue={selectedDeviceId}
              onValueChange={(value) => setSelectedDeviceId(value)}
            >
              <SelectTrigger 
                className="border border-border rounded-lg marker:flex-row items-center justify-between"
                style={{ height: 45 }}
              >
                <SelectInput 
                  placeholder="选择设备" 
                  style={{ color: '#000' }}
                  value={selectedDevice?.name}
                />
                <SelectIcon as={ChevronDownIcon} />
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent>
                  <SelectDragIndicatorWrapper>
                    <SelectDragIndicator />
                  </SelectDragIndicatorWrapper>
                  {devices.map((device) => (
                    <SelectItem
                      key={device.id}
                      label={device.name}
                      value={device.id.toString()}
                      className="p-3"
                    />
                  ))}
                </SelectContent>
              </SelectPortal>
            </Select>
            <HStack className="items-center mt-2 mb-4">
              <Icon as={Clock} className="h-4 w-4 mr-1 text-gray-500" />
              <Text className="text-sm text-gray-500">最后更新: {selectedDevice?.lastUpdate}</Text>
            </HStack>
            {!showConfirmation && (
              <Button
                className="w-full"
                onPress={() => setShowConfirmation(true)}
              >
                <ButtonText>远程开锁</ButtonText>
              </Button>
            )}
          </VStack>
        </View>

        <VStack className="space-y-3 gap-2">
          <Text className="text-lg font-medium">最近访客</Text>
          {recentVisitors.map((visitor) => (
            <HStack key={visitor.id} className="items-center p-3 border border-border rounded-lg bg-white">
              <View className="h-12 w-12 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Icon as={User} className="h-6 w-6 text-gray-600" />
              </View>
              <VStack className="flex-1">
                <Text className="text-sm font-medium">{visitor.name}</Text>
                <Text className="text-xs text-gray-500">
                  {visitor.time} · {visitor.device}
                </Text>
              </VStack>
              <TouchableOpacity className="px-3 py-1 bg-gray-100 rounded-full">
                <Text className="text-xs">查看照片</Text>
              </TouchableOpacity>
            </HStack>
          ))}
        </VStack>

        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <Text className="text-sm font-medium text-yellow-800 mb-2">安全提示</Text>
          <Text className="text-xs text-yellow-700">
            远程开锁功能将通过门锁摄像头拍摄照片，并发送给您确认。请确保您认识需要进入的人员，以保障家庭安全。
          </Text>
        </View>
      </VStack>
    </ScrollView>
  );
}
