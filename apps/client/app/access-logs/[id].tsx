import { useState, useEffect } from "react"
import {
  ChevronLeft,
  Calendar,
  Search,
  Filter,
  User,
  Fingerprint,
  Key,
  Smartphone,
  ChevronRight,
  AlertTriangle,
  Info,
  ChevronDown,
  X
} from "lucide-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"
import dayjs from "dayjs"
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Button } from "@/components/ui/button"
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input"
import { Select, SelectItem, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicator, SelectDragIndicatorWrapper } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Box } from "@/components/ui/box"
import { Text } from "@/components/ui/text"
import { View, ScrollView, Pressable, Image as RNImage } from "react-native"
import { cn } from "@/lib/utils"
import { HStack } from "@/components/ui/hstack"
import { VStack } from "@/components/ui/vstack"
import { Modal, ModalBackdrop, ModalContent, ModalBody, ModalCloseButton, ModalHeader, ModalFooter } from "@/components/ui/modal"
import { Menu, MenuItem, MenuSeparator } from "@/components/ui/menu"
import DatePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker'
import { Icon } from "@/components/ui/icon"

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

// 定义访问记录类型
interface AccessLog {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  accessTime: Date
  accessMethod: "password" | "fingerprint" | "app" | "card" | "temporary"
  status: "success" | "failed"
  deviceName: string
  deviceId: string
  location?: string
  details?: string
}

// 定义访问方式详情
const accessMethodDetails = {
  password: { icon: Key, label: "密码", color: "bg-blue-100 text-blue-700" },
  fingerprint: { icon: Fingerprint, label: "指纹", color: "bg-green-100 text-green-700" },
  app: { icon: Smartphone, label: "应用", color: "bg-purple-100 text-purple-700" },
  card: { icon: Key, label: "门卡", color: "bg-yellow-100 text-yellow-700" },
  temporary: { icon: Key, label: "临时密码", color: "bg-orange-100 text-orange-700" },
}

const accessMethods = ["密码", "指纹", "应用", "门卡", "临时密码"];

export default function AccessLogs() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const id = params.id as string
  
  const [deviceName, setDeviceName] = useState("加载中...")
  const [isLoading, setIsLoading] = useState(true)
  const [logs, setLogs] = useState<AccessLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AccessLog[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAccessMethods, setSelectedAccessMethods] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{
    startDate: DateType
    endDate: DateType
  }>({
    startDate: undefined,
    endDate: undefined,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [showCalendar, setShowCalendar] = useState(false)
  const [showAccessMethodsFilter, setShowAccessMethodsFilter] = useState(false)
  const logsPerPage = 10

  // 获取默认样式
  const defaultStyles = useDefaultStyles();

  // 日期选择器自定义样式
  const customStyles = {
    ...defaultStyles,
    selected: { backgroundColor: '#E53E3E' }, // 主色调红色
    selectedText: { color: '#ffffff', fontWeight: '600' },
    today: { borderColor: '#E53E3E', borderWidth: 1 },
    todayText: { color: '#E53E3E', fontWeight: '600' },
    monthHeaderButton: { color: '#E53E3E' },
  };

  // 模拟数据获取
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      // 模拟API延迟
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 模拟设备信息
      setDeviceName(id === "1" ? "前门" : id === "2" ? "后门" : `设备 ${id}`)

      // 模拟日志数据
      const mockLogs: AccessLog[] = Array.from({ length: 50 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))

        const methods = ["password", "fingerprint", "app", "card", "temporary"] as const
        const statuses = ["success", "failed"] as const
        const users = [
          { id: "1", name: "张三", avatar: "https://via.placeholder.com/40" },
          { id: "2", name: "李四", avatar: "https://via.placeholder.com/40" },
          { id: "3", name: "王五", avatar: "https://via.placeholder.com/40" },
          { id: "4", name: "赵六", avatar: "https://via.placeholder.com/40" },
        ]

        const user = users[Math.floor(Math.random() * users.length)]
        const accessMethod = methods[Math.floor(Math.random() * methods.length)]
        const status = Math.random() > 0.2 ? "success" : "failed"

        return {
          id: `log-${i + 1}`,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          accessTime: date,
          accessMethod,
          status,
          deviceName: id === "1" ? "前门" : id === "2" ? "后门" : `设备 ${id}`,
          deviceId: id,
          location: accessMethod === "app" ? "远程访问" : "本地访问",
          details: status === "failed" ? "验证失败" : undefined,
        }
      })

      // 按日期降序排序
      mockLogs.sort((a, b) => b.accessTime.getTime() - a.accessTime.getTime())

      setLogs(mockLogs)
      setFilteredLogs(mockLogs)
      setIsLoading(false)
    }

    fetchData()
  }, [id])

  // 应用所有筛选条件
  useEffect(() => {
    let result = [...logs]

    // 按搜索查询筛选（用户名）
    if (searchQuery) {
      result = result.filter((log) => log.userName.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // 按访问方式筛选
    if (selectedAccessMethods.length > 0) {
      result = result.filter((log) => selectedAccessMethods.includes(log.accessMethod))
    }

    // 按状态筛选
    if (selectedStatus) {
      result = result.filter((log) => log.status === selectedStatus)
    }

    // 按日期范围筛选
    if (dateRange.startDate || dateRange.endDate) {
      result = result.filter((log) => {
        const logDate = new Date(log.accessTime)
        if (dateRange.startDate && dateRange.endDate) {
          const startDate = dayjs(dateRange.startDate).toDate();
          const endDate = dayjs(dateRange.endDate).toDate();
          return logDate >= startDate && logDate <= endDate;
        } else if (dateRange.startDate) {
          const startDate = dayjs(dateRange.startDate).toDate();
          return logDate >= startDate;
        } else if (dateRange.endDate) {
          const endDate = dayjs(dateRange.endDate).toDate();
          return logDate <= endDate;
        }
        return true
      })
    }

    setFilteredLogs(result)
    setCurrentPage(1) // 筛选条件改变时重置到第一页
  }, [logs, searchQuery, selectedAccessMethods, selectedStatus, dateRange])

  // 计算分页
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage)
  const indexOfLastLog = currentPage * logsPerPage
  const indexOfFirstLog = indexOfLastLog - logsPerPage
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)

  // 按日期分组日志
  const groupedLogs: { [date: string]: AccessLog[] } = {}
  currentLogs.forEach((log) => {
    const dateKey = dayjs(log.accessTime).format("YYYY-MM-DD")
    if (!groupedLogs[dateKey]) {
      groupedLogs[dateKey] = []
    }
    groupedLogs[dateKey].push(log)
  })

  // 处理分页
  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  // 清除所有筛选条件
  const clearFilters = () => {
    setSearchQuery("")
    setSelectedAccessMethods([])
    setSelectedStatus(null)
    setDateRange({
      startDate: undefined,
      endDate: undefined,
    })
  }

  // 开门方式数据
  const accessMethodsData = [
    { id: "password", label: "密码", icon: Key, color: "#3B82F6" },
    { id: "fingerprint", label: "指纹", icon: Fingerprint, color: "#10B981" },
    { id: "app", label: "应用", icon: Smartphone, color: "#8B5CF6" },
    { id: "card", label: "门卡", icon: Key, color: "#F59E0B" },
    { id: "temporary", label: "临时密码", icon: Key, color: "#F59E0B" }
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* 头部 */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <HStack space="md" className="items-center">
            <Pressable onPress={() => router.back()} className="mr-1">
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </Pressable>
            <Text className="text-lg font-semibold text-gray-800">访问记录</Text>
          </HStack>
          <Text className="text-sm text-gray-500">{deviceName}</Text>
        </View>

        {/* 筛选器 */}
        <View className="px-4 py-3 bg-white">
          <View className="mb-4">
            <Input className="bg-white border border-gray-200 rounded-lg">
              <InputSlot className="pl-3">
                <InputIcon as={Search} className="h-5 w-5 text-gray-400" />
              </InputSlot>
              <InputField
                placeholder="搜索用户..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </Input>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-3">
            <HStack className="space-x-2 gap-2">
              {/* 日期范围筛选 */}
              <Box>
                <Pressable
                  onPress={() => setShowCalendar(!showCalendar)}
                  className={cn(
                    "flex-row items-center justify-between border border-gray-200 rounded-md p-2 bg-white w-32 h-10 shadow",
                    dateRange.startDate && dateRange.endDate && "bg-red-50 border-red-500"
                  )}
                >
                  <HStack space="sm" className="items-center">
                    <Icon as={Calendar} className={cn("h-4 w-4 mr-1", dateRange.startDate && dateRange.endDate ? "text-red-500" : "text-gray-500")} />
                    <Text className={cn("text-sm", dateRange.startDate && dateRange.endDate ? "text-red-500" : "text-gray-500")} numberOfLines={1} ellipsizeMode="tail">
                      {dateRange.startDate && dateRange.endDate
                        ? `${dayjs(dateRange.startDate).format("MM/DD")} - ${dayjs(dateRange.endDate).format("MM/DD")}`
                        : "日期范围"}
                    </Text>
                  </HStack>
                </Pressable>
                
                <Modal
                  isOpen={showCalendar}
                  onClose={() => setShowCalendar(false)}
                  size="lg"
                >
                  <ModalBackdrop />
                  <ModalContent>
                    <ModalHeader className="border-b border-gray-100">
                      <Text className="text-center font-medium">选择日期范围</Text>
                      <ModalCloseButton>
                        <X className="h-5 w-5 text-gray-400" />
                      </ModalCloseButton>
                    </ModalHeader>
                    <ModalBody>
                      <DatePicker
                        mode="range"
                        locale="zh"
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onChange={(params) => {
                          setDateRange({
                            startDate: params.startDate,
                            endDate: params.endDate
                          });
                        }}
                        style={{
                          marginHorizontal: 0,
                          marginVertical: 0,
                          borderRadius: 8,
                          borderWidth: 0,
                        }}
                        styles={customStyles}
                      />
                    </ModalBody>
                    <ModalFooter className="border-t border-gray-200">
                      <HStack className="justify-between p-3 w-full">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onPress={() => {
                            setDateRange({ startDate: undefined, endDate: undefined });
                            setShowCalendar(false);
                          }}
                          className="px-6"
                        >
                          <Text>清除</Text>
                        </Button>
                        <Button 
                          size="sm" 
                          onPress={() => setShowCalendar(false)}
                          className="px-6 bg-red-600"
                        >
                          <Text className="text-white">应用</Text>
                        </Button>
                      </HStack>
                    </ModalFooter>
                  </ModalContent>
                </Modal>
              </Box>

              {/* 开门方式筛选 */}
                <Menu
                  trigger={(triggerProps) => {
                    return (
                      <Pressable
                        {...triggerProps}
                        className={cn(
                          "flex-row items-center justify-between border border-gray-200 rounded-md p-2 bg-white w-32 h-10 shadow",
                          selectedAccessMethods.length > 0 && "bg-red-50 border-red-500"
                        )}
                      >
                        <HStack space="sm" className="items-center">
                          <Key size={16} color={selectedAccessMethods.length > 0 ? "#EF4444" : "#6B7280"} />
                          <Text className={cn("text-sm", selectedAccessMethods.length > 0 ? "text-red-500" : "text-gray-500")} numberOfLines={1} ellipsizeMode="tail">
                            {selectedAccessMethods.length > 0 ? `已选${selectedAccessMethods.length}项` : "开门方式"}
                          </Text>
                          <ChevronDown size={16} color={selectedAccessMethods.length > 0 ? "#EF4444" : "#6B7280"} />
                        </HStack>
                      </Pressable>
                    )
                  }}
                  offset={-30}
                  placement="bottom"
                  closeOnSelect={false}
                  className="shadow"
                >
                  <MenuItem className="p-0">
                    <VStack space="xs" className="w-full">
                      {accessMethodsData.map((method) => (
                        <Pressable
                          key={method.id}
                          className={`w-full p-3 border-b border-gray-100 flex-row items-center justify-between ${
                            selectedAccessMethods.includes(method.id) ? "bg-red-50" : ""
                          }`}
                          onPress={() => {
                            if (selectedAccessMethods.includes(method.id)) {
                              setSelectedAccessMethods(
                                selectedAccessMethods.filter((m) => m !== method.id)
                              )
                            } else {
                              setSelectedAccessMethods([...selectedAccessMethods, method.id])
                            }
                          }}
                        >
                          <HStack className="items-center justify-between">
                            <HStack space="md" className="items-center">
                              <method.icon size={18} color={method.color} />
                              <Text className="text-sm">{method.label}</Text>
                            </HStack>
                            {selectedAccessMethods.includes(method.id) && (
                              <Box className="w-4 h-4 rounded-full bg-red-500"></Box>
                            )}
                          </HStack>
                        </Pressable>
                      ))}
                    </VStack>
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem>
                    <Pressable
                      className="p-3 flex w-full"
                      onPress={() => {
                        setSelectedAccessMethods([])
                      }}
                    >
                      <Text className="text-sm text-gray-500">清除选择</Text>
                    </Pressable>
                  </MenuItem>
                </Menu>

              {/* 状态筛选 */}
                <Menu
                  trigger={(triggerProps) => {
                    return (
                      <Pressable
                        {...triggerProps}
                        className={cn(
                          "flex-row items-center justify-between border border-gray-200 rounded-md p-2 bg-white w-32 h-10 shadow",
                          selectedStatus && "bg-red-50 border-red-500"
                        )}
                        offset={-30}
                        placement="bottom"
                        closeOnSelect={false}
                        
                      >
                        <HStack space="sm" className="items-center">
                          <Icon as={Filter} className={cn("h-4 w-4 mr-1", selectedStatus ? "text-red-500" : "text-gray-500")} />
                          <Text className={cn("text-sm", selectedStatus ? "text-red-500" : "text-gray-500")} numberOfLines={1} ellipsizeMode="tail">
                            {selectedStatus ? (selectedStatus === "success" ? "成功" : "失败") : "状态"}
                          </Text>
                          <ChevronDown size={16} color={selectedStatus ? "#EF4444" : "#6B7280"} />
                        </HStack>
                      </Pressable>
                    )
                  }}
                  offset={-30}
                  placement="bottom"
                  closeOnSelect={false}
                  className="shadow"
                >
                  <MenuItem className="p-0">
                    <VStack space="xs" className="w-full">
                      <Pressable
                        className={`w-full p-3 border-b border-gray-100 flex-row items-center justify-between ${
                          selectedStatus === "success" ? "bg-red-50" : ""
                        }`}
                        onPress={() => setSelectedStatus("success")}
                      >
                        <HStack className="items-center justify-between w-full">
                          <Text className="text-sm">成功</Text>
                          {selectedStatus === "success" && (
                            <Box className="w-4 h-4 rounded-full bg-red-500"></Box>
                          )}
                        </HStack>
                      </Pressable>
                      <Pressable
                        className={`w-full p-3 border-b border-gray-100 flex-row items-center justify-between ${
                          selectedStatus === "failed" ? "bg-red-50" : ""
                        }`}
                        onPress={() => setSelectedStatus("failed")}
                      >
                        <HStack className="items-center justify-between w-full">
                          <Text className="text-sm">失败</Text>
                          {selectedStatus === "failed" && (
                            <Box className="w-4 h-4 rounded-full bg-red-500"></Box>
                          )}
                        </HStack>
                      </Pressable>
                    </VStack>
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem>
                    <Pressable
                      className="p-3 flex w-full"
                      onPress={() => {
                        setSelectedStatus(null)
                      }}
                    >
                      <Text className="text-sm text-gray-500">清除选择</Text>
                    </Pressable>
                  </MenuItem>
                </Menu>

              {/* 清除筛选 */}
              {(searchQuery || selectedAccessMethods.length > 0 || selectedStatus || (dateRange.startDate && dateRange.endDate)) && (
                <Pressable 
                  onPress={clearFilters} 
                  className="flex-row items-center justify-center border border-gray-200 rounded-md p-2 bg-white h-10"
                >
                  <Text className="text-red-500 text-sm">清除筛选</Text>
                </Pressable>
              )}
            </HStack>
          </ScrollView>
        </View>

        {/* 访问记录 */}
        <View className="px-4 py-4">
          <VStack className="space-y-6">
            {isLoading ? (
              // 加载骨架屏
              Array.from({ length: 5 }).map((_, index) => (
                <VStack key={index} className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <VStack className="space-y-2">
                    {Array.from({ length: 2 }).map((_, itemIndex) => (
                      <HStack key={itemIndex} className="items-center space-x-3 border rounded-lg p-3 bg-white">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <VStack className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-28" />
                        </VStack>
                        <Skeleton className="h-6 w-16" />
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              ))
            ) : filteredLogs.length === 0 ? (
              // 无结果状态
              <VStack className="items-center py-12 space-y-3">
                <Calendar className="h-12 w-12 text-gray-300" />
                <Text className="text-lg font-medium text-gray-500">没有找到记录</Text>
                <Text className="text-sm text-gray-400 text-center">尝试调整筛选条件或者清除所有筛选</Text>
                <Button variant="outline" size="sm" onPress={clearFilters} className="mt-2">
                  <Text>清除所有筛选</Text>
                </Button>
              </VStack>
            ) : (
              // 按日期分组的日志
              Object.keys(groupedLogs)
                .sort()
                .reverse()
                .map((dateKey) => (
                  <VStack key={dateKey} className="space-y-2">
                    <Text className="text-sm font-medium text-gray-500 px-1">
                      {dayjs(new Date(dateKey)).format("YYYY年MM月DD日")}
                    </Text>
                    <VStack className="space-y-2">
                      {groupedLogs[dateKey].map((log) => {
                        return (
                          <Box key={log.id} className={cn(
                            "bg-white rounded-lg border p-3 mb-2",
                            log.status === "failed" ? "border-red-200" : "border-gray-100"
                          )}>
                            <HStack className="items-center">
                              {log.userAvatar ? (
                                <RNImage
                                  source={{ uri: log.userAvatar }}
                                  className="h-12 w-12 rounded-full mr-3"
                                />
                              ) : (
                                <Box className="h-12 w-12 rounded-full bg-gray-200 mr-3 items-center justify-center">
                                  <User className="h-6 w-6 text-gray-400" />
                                </Box>
                              )}
                              <VStack className="flex-1">
                                <HStack className="items-center justify-between">
                                  <Text className="font-medium text-gray-800">{log.userName}</Text>
                                  <Text className="text-sm text-blue-500">
                                    {dayjs(log.accessTime).format("HH:mm")}
                                  </Text>
                                </HStack>
                                <HStack className="items-center mt-1 space-x-2">
                                  <Box className={cn(
                                    "px-2 py-0.5 rounded-md",
                                    log.accessMethod === "app" ? "bg-purple-100" : 
                                    log.accessMethod === "fingerprint" ? "bg-green-100" : 
                                    log.accessMethod === "password" ? "bg-blue-100" : 
                                    log.accessMethod === "card" ? "bg-yellow-100" : 
                                    log.accessMethod === "temporary" ? "bg-orange-100" : "bg-gray-100"
                                  )}>
                                    <Text className={cn(
                                      "text-xs",
                                      log.accessMethod === "app" ? "text-purple-700" : 
                                      log.accessMethod === "fingerprint" ? "text-green-700" : 
                                      log.accessMethod === "password" ? "text-blue-700" : 
                                      log.accessMethod === "card" ? "text-yellow-700" : 
                                      log.accessMethod === "temporary" ? "text-orange-700" : "text-gray-700"
                                    )}>
                                      {accessMethodDetails[log.accessMethod].label}
                                    </Text>
                                  </Box>
                                  <Text className="text-xs text-gray-500">
                                    {log.location === "remote" ? "远程访问" : "本地访问"}
                                  </Text>
                                  {log.status === "failed" && (
                                    <Box className="px-2 py-0.5 rounded-md bg-red-100 ml-auto">
                                      <Text className="text-xs text-red-700">失败</Text>
                                    </Box>
                                  )}
                                </HStack>
                              </VStack>
                            </HStack>
                          </Box>
                        );
                      })}
                    </VStack>
                  </VStack>
                ))
            )}
          </VStack>

          {/* 分页 */}
          {!isLoading && filteredLogs.length > 0 && totalPages > 1 && (
            <HStack className="items-center justify-between mt-6 pt-4 border-t">
              <Button
                size="sm"
                variant="outline"
                onPress={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-0 h-8"
              >
                <HStack className="items-center">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <Text>上一页</Text>
                </HStack>
              </Button>
              <Text className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </Text>
              <Button
                size="sm"
                variant="outline"
                onPress={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-0 h-8"
              >
                <HStack className="items-center">
                  <Text>下一页</Text>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </HStack>
              </Button>
            </HStack>
          )}
        </View>

        {/* 附加信息 */}
        <Box className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
          <Text className="font-medium mb-2 text-blue-700">
            <HStack className="items-center">
              <Info className="h-4 w-4 mr-2" />
              <Text className="text-blue-700">访问记录说明</Text>
            </HStack>
          </Text>
          <Text className="text-blue-600 text-xs">
            此页面显示了该设备的访问记录，包括访问者、时间和访问方式。您可以使用筛选功能查找特定的记录。 系统会保留最近 90
            天的访问记录用于安全审计和统计。
          </Text>
        </Box>
      </ScrollView>
    </View>
  )
}