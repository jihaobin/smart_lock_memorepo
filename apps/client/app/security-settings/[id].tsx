import React, { useState, useEffect } from "react"
import { ChevronLeft, Bell, Shield, AlertTriangle, Camera, Fingerprint } from "lucide-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { Text } from "@/components/ui/text"
import { HStack } from "@/components/ui/hstack"
import { VStack } from "@/components/ui/vstack"
import { Box } from "@/components/ui/box"
import { Heading } from "@/components/ui/heading"
import { Pressable } from "@/components/ui/pressable"
import { Switch } from "@/components/ui/switch"
import { Icon } from "@/components/ui/icon"
import { Button, ButtonText } from "@/components/ui/button"
import { ScrollView } from "react-native"

export default function SecuritySettings() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [deviceName, setDeviceName] = useState("我的智能锁")
  
  const [securitySettings, setSecuritySettings] = useState({
    tamperAlert: true,
    wrongPasswordAlert: true,
    lowBatteryAlert: true,
    doorOpenAlert: true,
    capturePhoto: true,
    fingerprintVerification: true,
  })

  // 根据设备ID获取设备信息
  useEffect(() => {
    // 这里可以添加获取设备信息的逻辑
    // 例如从API获取设备名称和安全设置状态
    if (id) {
      // 模拟从API获取数据
      // 实际项目中，这里应该是一个API调用
      
      // 模拟不同设备有不同的设置
      if (id === '1') {
        setDeviceName("前门智能锁")
        setSecuritySettings({
          tamperAlert: true,
          wrongPasswordAlert: true,
          lowBatteryAlert: true,
          doorOpenAlert: true,
          capturePhoto: true,
          fingerprintVerification: true,
        })
      } else if (id === '2') {
        setDeviceName("后门智能锁")
        setSecuritySettings({
          tamperAlert: false,
          wrongPasswordAlert: true,
          lowBatteryAlert: true,
          doorOpenAlert: false,
          capturePhoto: false,
          fingerprintVerification: true,
        })
      } else {
        setDeviceName(`智能锁 #${id}`)
      }
    }
  }, [id])

  const handleToggleChange = (setting: keyof typeof securitySettings) => {
    setSecuritySettings({
      ...securitySettings,
      [setting]: !securitySettings[setting],
    })
    
  }

  // 自定义Switch组件，添加自定义颜色
  const CustomSwitch = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => {
    return (
      <Switch
        size="md"
        value={value}
        onToggle={onToggle}
        trackColor={{ false: "#e2e8f0", true: "#f56565" }}
        thumbColor={value ? "#fff" : "#fff"}
        ios_backgroundColor="#e2e8f0"
        className="scale-90"
      />
    )
  }

  return (
    <ScrollView>
      <VStack className="space-y-6 gap-4 px-4 py-6 flex-1 bg-gray-50">
        <HStack className="items-center justify-between">
          <Heading size="md" className="text-gray-800">安全设置</Heading>
          <Text>{deviceName}</Text>
        </HStack>

        <Box className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <Box className="px-4 py-3 border-b border-gray-200">
            <Heading size="sm" className="text-gray-800">警报设置</Heading>
          </Box>

          <Box className="px-4 py-3 border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="space-x-3 flex-1">
                <Box className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                  <Icon as={AlertTriangle} size="sm" color="#EF4444" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">防拆警报</Text>
                  <Text className="text-xs text-gray-500">当检测到门锁被拆卸时发出警报</Text>
                </VStack>
              </HStack>
              <CustomSwitch 
                value={securitySettings.tamperAlert}
                onToggle={() => handleToggleChange("tamperAlert")}
              />
            </HStack>
          </Box>

          <Box className="px-4 py-3 border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="space-x-3 flex-1">
                <Box className="w-8 h-8 rounded-full bg-orange-50 items-center justify-center">
                  <Icon as={Shield} size="sm" color="#F97316" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">密码错误警报</Text>
                  <Text className="text-xs text-gray-500">连续输入错误密码时发出警报</Text>
                </VStack>
              </HStack>
              <CustomSwitch 
                value={securitySettings.wrongPasswordAlert}
                onToggle={() => handleToggleChange("wrongPasswordAlert")}
              />
            </HStack>
          </Box>

          <Box className="px-4 py-3 border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="space-x-3 flex-1">
                <Box className="w-8 h-8 rounded-full bg-yellow-50 items-center justify-center">
                  <Icon as={Bell} size="sm" color="#EAB308" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">电量低警报</Text>
                  <Text className="text-xs text-gray-500">当电池电量低于20%时通知</Text>
                </VStack>
              </HStack>
              <CustomSwitch 
                value={securitySettings.lowBatteryAlert}
                onToggle={() => handleToggleChange("lowBatteryAlert")}
              />
            </HStack>
          </Box>

          <Box className="px-4 py-3">
            <HStack className="justify-between items-center">
              <HStack className="space-x-3 flex-1">
                <Box className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                  <Icon as={Bell} size="sm" color="#3B82F6" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">门开启通知</Text>
                  <Text className="text-xs text-gray-500">当门被打开时发送通知</Text>
                </VStack>
              </HStack>
              <CustomSwitch 
                value={securitySettings.doorOpenAlert}
                onToggle={() => handleToggleChange("doorOpenAlert")}
              />
            </HStack>
          </Box>
        </Box>

        <Box className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
          <Box className="px-4 py-3 border-b border-gray-200">
            <Heading size="sm" className="text-gray-800">安全验证</Heading>
          </Box>

          <Box className="px-4 py-3 border-b border-gray-100">
            <HStack className="justify-between items-center">
              <HStack className="space-x-3 flex-1">
                <Box className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                  <Icon as={Camera} size="sm" color="#4B5563" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">拍摄访客照片</Text>
                  <Text className="text-xs text-gray-500">当有人使用密码或临时密码开门时拍照</Text>
                </VStack>
              </HStack>
              <CustomSwitch 
                value={securitySettings.capturePhoto}
                onToggle={() => handleToggleChange("capturePhoto")}
              />
            </HStack>
          </Box>

          <Box className="px-4 py-3">
            <HStack className="justify-between items-center">
              <HStack className="space-x-3 flex-1">
                <Box className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                  <Icon as={Fingerprint} size="sm" color="#4B5563" />
                </Box>
                <VStack className="flex-1">
                  <Text className="text-sm font-medium text-gray-800">指纹验证</Text>
                  <Text className="text-xs text-gray-500">使用指纹进行身份验证</Text>
                </VStack>
              </HStack>
              <CustomSwitch 
                value={securitySettings.fingerprintVerification}
                onToggle={() => handleToggleChange("fingerprintVerification")}
              />
            </HStack>
          </Box>
        </Box>

        <Box className="border border-red-200 rounded-xl bg-red-50 p-4 shadow-sm">
          <Heading size="xs" className="text-red-800 mb-2">紧急联系人</Heading>
          <Text className="text-xs text-red-700 mb-3">
            设置紧急情况下自动通知的联系人，当检测到异常情况时系统将自动通知。
          </Text>
          <Button
            size="sm"
            className="bg-red-500"
            onPress={() => {
              // 由于紧急联系人页面可能还未创建，这里使用alert提示
              router.push({
                pathname: "/emergency-contacts/[id]",
                params: { id: id.toString() }
              })
            }}
          >
            <ButtonText className="text-white">设置紧急联系人</ButtonText>
          </Button>
        </Box>
      </VStack>
    </ScrollView>
  )
}
