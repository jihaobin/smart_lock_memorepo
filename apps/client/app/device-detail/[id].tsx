import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function DeviceDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [device, setDevice] = useState<{
    id: number;
    name: string;
    model: string;
    batteryLevel: number;
    isOnline: boolean;
    firmwareVersion: string;
    lastUpdate: string;
    serialNumber: string;
    purchaseDate: string;
    warrantyEnd: string;
  } | null>(null);

  const [usageStats, setUsageStats] = useState({
    totalUnlocks: 245,
    averageUnlocksPerDay: 8,
    mostActiveDay: "周一",
    mostActiveTime: "08:00 - 09:00",
    batteryLifeEstimate: "约45天",
  });

  useEffect(() => {
    // 在实际应用中，这里应该从API获取设备详情
    // 这里我们模拟API调用
    setDevice({
      id: Number(id),
      name: `设备 ${id}`,
      model: "智能门锁 Pro",
      batteryLevel: 85,
      isOnline: true,
      firmwareVersion: "2.1.4",
      lastUpdate: "2023-11-15",
      serialNumber: "SN12345678",
      purchaseDate: "2023-01-15",
      warrantyEnd: "2025-01-15",
    });
  }, [id]);

  if (!device) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
        <Text className="mt-2.5 text-base">加载中...</Text>
      </View>
    );
  }

  const getBatteryColor = () => {
    if (device.batteryLevel > 50) return "bg-green-500"; // green
    if (device.batteryLevel > 20) return "bg-yellow-500"; // yellow
    return "bg-red-500"; // red
  };

  return (
    <ScrollView className="flex-1 bg-gray-100 px-4 py-4">
      <View className="bg-white rounded-xl mb-6 p-4 shadow-sm">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="text-base font-medium mb-0.5">{device.name}</Text>
            <Text className="text-sm text-gray-500">{device.model}</Text>
          </View>
          <View className="flex-row items-center">
            {device.isOnline ? (
              <Feather name="wifi" size={16} color="#22c55e" className="mr-2" />
            ) : (
              <Feather name="wifi-off" size={16} color="#9ca3af" className="mr-2" />
            )}
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="battery" size={16} color="#6b7280" />
              <Text className="text-xs text-gray-500 ml-1">{device.batteryLevel}%</Text>
            </View>
          </View>
        </View>

        <View className="my-3">
          <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className={`h-2.5 rounded-full ${getBatteryColor()}`}
              style={{ width: `${device.batteryLevel}%` }} 
            />
          </View>
        </View>

        <View className="flex-row flex-wrap">
          <View className="w-1/2 mb-2">
            <Text className="text-sm text-gray-600 font-medium">序列号:</Text>
            <Text className="text-sm text-gray-800">{device.serialNumber}</Text>
          </View>
          <View className="w-1/2 mb-2">
            <Text className="text-sm text-gray-600 font-medium">固件版本:</Text>
            <Text className="text-sm text-gray-800">{device.firmwareVersion}</Text>
          </View>
          <View className="w-1/2 mb-2">
            <Text className="text-sm text-gray-600 font-medium">购买日期:</Text>
            <Text className="text-sm text-gray-800">{device.purchaseDate}</Text>
          </View>
          <View className="w-1/2 mb-2">
            <Text className="text-sm text-gray-600 font-medium">保修截止:</Text>
            <Text className="text-sm text-gray-800">{device.warrantyEnd}</Text>
          </View>
        </View>
      </View>

      <View className="bg-white rounded-xl mb-6 p-4 shadow-sm">
        <View className="flex-row items-center pb-3 border-b border-gray-200 mb-4">
          <Feather name="bar-chart-2" size={20} color="#3b82f6" className="mr-2" />
          <Text className="text-base font-medium">使用统计</Text>
        </View>
        
        <View className="px-1">
          <View className="flex-row justify-between mb-3">
            <View className="w-[48%] bg-white border border-gray-200 rounded-lg p-3">
              <Text className="text-sm text-gray-500 mb-1">总开锁次数</Text>
              <Text className="text-xl font-bold">{usageStats.totalUnlocks}</Text>
            </View>
            <View className="w-[48%] bg-white border border-gray-200 rounded-lg p-3">
              <Text className="text-sm text-gray-500 mb-1">日均开锁</Text>
              <Text className="text-xl font-bold">{usageStats.averageUnlocksPerDay}</Text>
            </View>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <View className="w-[48%] bg-white border border-gray-200 rounded-lg p-3">
              <Text className="text-sm text-gray-500 mb-1">最活跃日</Text>
              <View className="flex-row items-center mt-1">
                <Feather name="calendar" size={16} color="#9ca3af" />
                <Text className="text-base font-bold ml-1">{usageStats.mostActiveDay}</Text>
              </View>
            </View>
            <View className="w-[48%] bg-white border border-gray-200 rounded-lg p-3">
              <Text className="text-sm text-gray-500 mb-1">最活跃时段</Text>
              <View className="flex-row items-center mt-1">
                <Feather name="clock" size={16} color="#9ca3af" />
                <Text className="text-base font-bold ml-1">{usageStats.mostActiveTime}</Text>
              </View>
            </View>
          </View>
          
          <View className="bg-white border border-gray-200 rounded-lg p-3">
            <Text className="text-sm text-gray-500 mb-1">电池剩余使用时间</Text>
            <View className="flex-row items-center mt-1">
              <Feather name="zap" size={16} color="#eab308" />
              <Text className="text-base font-bold ml-1">{usageStats.batteryLifeEstimate}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row mb-6">
        <TouchableOpacity 
          className="flex-1 bg-white border border-gray-200 rounded-lg py-3 items-center mr-2"
          onPress={() => {
            // 使用简单的字符串路径，避免类型错误
            router.push({
              pathname: '/device-settings/[id]',
              params: { id: id.toString() },
            });
            // 实际应用中，这里应该跳转到设备设置页面
          }}
        >
          <Text className="text-black font-medium">设备设置</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="flex-1 bg-primary rounded-lg py-3 items-center"
          onPress={() => {
            // 使用简单的字符串路径，避免类型错误
            router.push({
              pathname: '/access-logs/[id]',
              params: { id: id.toString() },
            });
            // 实际应用中，这里应该跳转到访问记录页面
          }}
        >
          <Text className="text-white font-medium">查看访问记录</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
