import React, { useState, useEffect } from "react"
import { ChevronLeft, Plus, User, Phone, Shield, Trash2, PenLine, AlertTriangle } from "lucide-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import { ScrollView, ActivityIndicator } from "react-native"
import { Text } from "@/components/ui/text"
import { Box } from "@/components/ui/box"
import { VStack } from "@/components/ui/vstack"
import { HStack } from "@/components/ui/hstack"
import { Button, ButtonText } from "@/components/ui/button"
import { Pressable } from "@/components/ui/pressable"
import { Icon } from "@/components/ui/icon"
import { Heading } from "@/components/ui/heading"
import { EmergencyContactForm } from "@/components/emergency-contact/emergency-contact-form"
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogHeader, AlertDialogCloseButton, AlertDialogBody, AlertDialogFooter } from "@/components/ui/alert-dialog"
import { EmergencyContact } from "@/types/emergency-contact"
import { useToast } from "@/hooks/use-toast"

export default function EmergencyContacts() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<EmergencyContact | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // 模拟数据获取
  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true)
      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 模拟数据
      const mockContacts: EmergencyContact[] = [
        {
          id: "1",
          name: "张伟",
          relationship: "家人",
          phone: "13812345678",
          priority: 1,
          notifyOnEvents: ["tamper", "forced_entry", "multiple_failed_attempts"],
        },
        {
          id: "2",
          name: "王芳",
          relationship: "朋友",
          phone: "13987654321",
          priority: 2,
          notifyOnEvents: ["tamper", "forced_entry"],
        },
      ]

      setContacts(mockContacts)
      setIsLoading(false)
    }

    fetchContacts()
  }, [])

  const handleAddContact = () => {
    setEditingContact(null)
    setIsFormOpen(true)
  }

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact)
    setIsFormOpen(true)
  }

  const handleDeleteContact = (contact: EmergencyContact) => {
    setContactToDelete(contact)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (!contactToDelete) return

    try {
      // 过滤掉要删除的联系人
      setContacts(contacts.filter((c) => c.id !== contactToDelete.id))

      toast({
        title: "联系人已删除",
        description: `紧急联系人 "${contactToDelete.name}" 已成功删除。`,
      })

      setContactToDelete(null)
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: "删除失败",
        description: "无法删除联系人，请稍后重试。",
        variant: "destructive",
      })
    }
  }

  const handleSaveContact = (contact: EmergencyContact) => {
    try {
      if (editingContact) {
        // 更新现有联系人
        setContacts(contacts.map((c) => (c.id === contact.id ? contact : c)))
        toast({
          title: "联系人已更新",
          description: `紧急联系人 "${contact.name}" 已成功更新。`,
        })
      } else {
        // 添加新联系人
        const newContact = {
          ...contact,
          id: `${Date.now()}`, // 生成唯一ID
        }
        setContacts([...contacts, newContact])
        toast({
          title: "联系人已添加",
          description: `紧急联系人 "${contact.name}" 已成功添加。`,
        })
      }

      setIsFormOpen(false)
      setEditingContact(null)
    } catch (error) {
      toast({
        title: "保存失败",
        description: "无法保存联系人，请稍后重试。",
        variant: "destructive",
      })
    }
  }

  // 创建事件名称映射用于显示
  const eventNameMap: Record<string, string> = {
    tamper: "防拆报警",
    forced_entry: "强行闯入",
    multiple_failed_attempts: "多次验证失败",
    low_battery: "电量不足",
    door_left_open: "门未关闭",
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <VStack className="px-4 py-6 space-y-4">
        {/* 头部 */}
        <HStack className="items-center justify-between mb-2">
          <HStack className="items-center">
            <Pressable onPress={() => router.back()} className="mr-2">
              <Icon as={ChevronLeft} size="md" color="#1F2937" />
            </Pressable>
            <Heading size="md">紧急联系人</Heading>
          </HStack>
          <Button size="sm" onPress={handleAddContact}>
            <Icon as={Plus} size="sm" color="white" />
          </Button>
        </HStack>

        {/* 信息横幅 */}
        <Box className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-2">
          <VStack>
            <HStack className="items-center">
              <Icon as={AlertTriangle} size="sm" color="#F59E0B" />
              <Text className="font-medium text-amber-800">紧急联系人说明</Text>
            </HStack>
            <Text className="text-xs text-amber-700 mt-1">
                紧急联系人将在检测到异常情况时收到通知。您最多可以添加 5 个紧急联系人，并设置其优先级。
                优先级较高的联系人将首先收到通知。
              </Text>
            </VStack>
        </Box>

        {/* 联系人列表 */}
        {isLoading ? (
          <VStack className="space-y-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Box key={i} className="border rounded-lg p-4 bg-white">
                <Box className="h-5 w-24 bg-gray-200 rounded mb-2" />
                <Box className="h-4 w-32 bg-gray-200 rounded mb-2" />
                <Box className="h-4 w-40 bg-gray-200 rounded" />
              </Box>
            ))}
          </VStack>
        ) : contacts.length === 0 ? (
          <VStack className="items-center py-10 space-y-3 bg-gray-50 rounded-lg border gap-2">
            <Box className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
              <Icon as={User} size="lg" color="#D1D5DB" />
            </Box>
            <Heading size="sm" className="text-gray-500">暂无紧急联系人</Heading>
            <Text className="text-sm text-gray-400 text-center">添加紧急联系人以便系统在检测到异常情况时发送通知</Text>
            <Button size="sm" onPress={handleAddContact} className="mt-2">
              <Icon as={Plus} size="sm" color="white" className="mr-1" />
              <ButtonText>添加联系人</ButtonText>
            </Button>
          </VStack>
        ) : (
          <VStack className="space-y-3 gap-2">
            {contacts.map((contact) => (
              <Box key={contact.id} className="border rounded-lg p-4 bg-white">
                <HStack className="items-start justify-between">
                  <HStack className="items-center">
                    <Box className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                      <Icon as={User} size="sm" color="#6366F1" />
                    </Box>
                    <VStack>
                      <Text className="font-medium">{contact.name}</Text>
                      <Text className="text-xs text-gray-500">{contact.relationship}</Text>
                    </VStack>
                  </HStack>
                  <HStack className="space-x-1">
                    <Pressable
                      className="h-8 w-8 items-center justify-center"
                      onPress={() => handleEditContact(contact)}
                      accessibilityLabel={`编辑 ${contact.name}`}
                    >
                      <Icon as={PenLine} size="sm" color="#6B7280" />
                    </Pressable>
                    <Pressable
                      className="h-8 w-8 items-center justify-center"
                      onPress={() => handleDeleteContact(contact)}
                      accessibilityLabel={`删除 ${contact.name}`}
                    >
                      <Icon as={Trash2} size="sm" color="#6B7280" />
                    </Pressable>
                  </HStack>
                </HStack>

                <HStack className="mt-3 items-center">
                  <Icon as={Phone} size="xs" color="#9CA3AF" className="mr-2" />
                  <Text className="text-sm">{contact.phone}</Text>
                </HStack>

                <VStack className="mt-3">
                  <Text className="text-xs text-gray-500 mb-2">通知事件：</Text>
                  <HStack className="flex-wrap gap-2">
                    {contact.notifyOnEvents.map((event) => (
                      <Box key={event} className="px-2 py-1 rounded-full bg-gray-100">
                        <Text className="text-xs">{eventNameMap[event] || event}</Text>
                      </Box>
                    ))}
                  </HStack>
                </VStack>

                <HStack className="mt-3 items-center">
                  <Icon as={Shield} size="xs" color="#9CA3AF" className="mr-2" />
                  <Text className="text-xs text-gray-500">优先级：{contact.priority}</Text>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}

        {/* 添加/编辑联系人表单（条件渲染） */}
        {isFormOpen && (
          <EmergencyContactForm
            contact={editingContact}
            isOpen={isFormOpen}
            onClose={() => {
              setIsFormOpen(false)
              setEditingContact(null)
            }}
            onSave={handleSaveContact}
          />
        )}

        {/* 删除确认对话框 */}
        <AlertDialog isOpen={showDeleteDialog}>
          <AlertDialogBackdrop />
          <AlertDialogContent>
            <AlertDialogHeader>
              <Heading size="sm">确认删除联系人</Heading>
              <AlertDialogCloseButton onPress={() => setShowDeleteDialog(false)} />
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text>
                您确定要删除紧急联系人 "{contactToDelete?.name}" 吗？此操作无法撤销。
              </Text>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button variant="outline" onPress={() => setShowDeleteDialog(false)}>
                <ButtonText>取消</ButtonText>
              </Button>
              <Button onPress={confirmDelete} className="bg-red-600 ml-2">
                <ButtonText>确认删除</ButtonText>
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* 底部帮助文本 */}
        <VStack className="mt-6 items-center">
          <Text className="text-xs text-gray-500 text-center">
            紧急联系人将在发生异常情况时通过短信或电话接收通知。
          </Text>
          <Text className="text-xs text-gray-500 text-center">
            请确保添加的联系人电话号码正确且随时可用。
          </Text>
        </VStack>
      </VStack>
    </ScrollView>
  )
}
