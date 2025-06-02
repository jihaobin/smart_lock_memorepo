import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import * as Clipboard from 'expo-clipboard';
import { Link } from 'expo-router';
import {
  ChevronLeft,
  Plus,
  Clock,
  Trash2,
  Copy,
  Check,
  X,
  Calendar,
  AlertTriangle,
} from 'lucide-react-native';
import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView, Pressable, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import DatePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import 'dayjs/locale/zh-cn';
import { z } from 'zod';
import { useInfiniteQuery } from '@tanstack/react-query';

// 导入本地Gluestack UI组件
import CreatePassword from '@/components/create_password';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';
import { useTemporaryPasswordApi } from '@/hooks/api/useTemporaryPasswordApi';
import { useTemporaryPasswordService } from '@/services/temporaryPassword';

// 配置dayjs
dayjs.locale('zh-cn');

// 定义表单验证Schema（与后端API兼容）
const passwordFormSchema = z.object({
  name: z.string().min(1, '密码名称不能为空'),
  code: z.string().length(6, '密码必须是6位数字'),
  deviceId: z.string().length(5, '设备ID必须为5位字符'),
  expiryType: z.enum(['time', 'usage']),
  expiryValue: z.string().nullable(),
  usageLimit: z.number().nullable(),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

type TemporaryPasswordsProps = {
  deviceId?: string;
};

export default function TemporaryPasswords({ deviceId }: TemporaryPasswordsProps) {
  const toast = useToast();
  const temporaryPasswordService = useTemporaryPasswordService();
  const { useCreateTemporaryPassword, useDeleteTemporaryPassword } = useTemporaryPasswordApi();

  // API mutations
  const createMutation = useCreateTemporaryPassword();
  const deleteMutation = useDeleteTemporaryPassword();

  // 刷新状态
  const [refreshing, setRefreshing] = useState(false);

  // 使用无限查询获取临时密码列表
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      initialPageParam: 1,
      queryKey: ['temporaryPasswords', 'all'],
      queryFn: ({ pageParam = 1 }) =>
        temporaryPasswordService.getTemporaryPasswords({
          page: pageParam.toString(),
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: '10',
          // 不传递deviceId，获取所有设备的临时密码
        }),
      getNextPageParam: lastPage => {
        const { page, limit, total } = lastPage.meta;
        const hasMore = page * limit < total;
        return hasMore ? page + 1 : undefined;
      },
      enabled: true, // 总是启用查询
    });

  // 从分页数据中提取所有临时密码
  const passwords = useMemo(() => {
    return data?.pages.flatMap(page => page.items) ?? [];
  }, [data]);

  // 按设备ID分组临时密码
  const passwordsByDevice = useMemo(() => {
    const grouped = passwords.reduce(
      (acc, password) => {
        const deviceId = password.deviceId;
        if (!acc[deviceId]) {
          acc[deviceId] = [];
        }
        acc[deviceId].push(password);
        return acc;
      },
      {} as Record<string, typeof passwords>
    );

    // 按设备ID排序
    return Object.keys(grouped)
      .sort()
      .map(deviceId => ({
        deviceId,
        passwords: grouped[deviceId],
      }));
  }, [passwords]);

  // 为FlashList创建扁平化的数据结构
  const flatListData = useMemo(() => {
    const items: Array<{
      type: 'header' | 'password';
      id: string;
      deviceId?: string;
      passwordCount?: number;
      password?: any;
    }> = [];

    passwordsByDevice.forEach(({ deviceId, passwords: devicePasswords }) => {
      // 添加设备标题项
      items.push({
        type: 'header',
        id: `header-${deviceId}`,
        deviceId,
        passwordCount: devicePasswords.length,
      });

      // 添加该设备的所有密码项
      devicePasswords.forEach(password => {
        items.push({
          type: 'password',
          id: `password-${password.id}`,
          password,
        });
      });
    });

    return items;
  }, [passwordsByDevice]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePasswordId, setDeletePasswordId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<DateType>(dayjs().add(1, 'day').toDate());
  const [selectedTime, setSelectedTime] = useState<string>('15:06');

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

  // 使用React Hook Form
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      name: '',
      deviceId: '',
      expiryType: 'time',
      expiryValue: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'),
      usageLimit: null,
    },
  });

  const expiryType = watch('expiryType');

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // 上拉加载更多
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCreatePassword = async (data: PasswordFormValues) => {
    try {
      // 准备API数据
      const createData = {
        name: data.name,
        deviceId: data.deviceId,
        password: data.code,
        expiresAt:
          data.expiryType === 'time' && data.expiryValue ? new Date(data.expiryValue) : undefined,
        remainingUses: data.expiryType === 'usage' && data.usageLimit ? data.usageLimit : undefined,
      };

      await createMutation.mutateAsync(createData);

      setShowCreateModal(false);
      reset({
        code: Math.floor(100000 + Math.random() * 900000).toString(),
        name: '',
        deviceId: '',
        expiryType: 'time',
        expiryValue: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'),
        usageLimit: null,
      });

      // 刷新数据
      await refetch();

      toast.toast({
        variant: 'success',
        title: '创建成功',
        description: '临时密码已创建',
      });
    } catch (error) {
      toast.toast({
        variant: 'destructive',
        title: '创建失败',
        description: error instanceof Error ? error.message : '创建临时密码时发生错误',
      });
    }
  };

  const handleCopyCode = async (code: string, id: string) => {
    await Clipboard.setStringAsync(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);

    toast.toast({
      variant: 'success',
      title: '复制成功',
      description: '密码已复制到剪贴板',
    });
  };

  // 显示删除确认模态框
  const handleDeleteConfirm = (id: string) => {
    setDeletePasswordId(id);
    setShowDeleteModal(true);
  };

  // 确认删除密码
  const confirmDelete = async () => {
    if (deletePasswordId !== null) {
      try {
        await deleteMutation.mutateAsync(deletePasswordId);
        setShowDeleteModal(false);
        setDeletePasswordId(null);

        // 刷新数据
        await refetch();

        toast.toast({
          variant: 'success',
          title: '删除成功',
          description: '临时密码已删除',
        });
      } catch (error) {
        toast.toast({
          variant: 'destructive',
          title: '删除失败',
          description: error instanceof Error ? error.message : '删除临时密码时发生错误',
        });
      }
    }
  };

  // const generateNewCode = () => {
  //   setValue('code', Math.floor(100000 + Math.random() * 900000).toString());
  // };

  const handleDateChange = (date: DateType) => {
    if (date && date) {
      setSelectedDate(date);
      updateExpiryValue();
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    updateExpiryValue();
  };

  const updateExpiryValue = () => {
    if (selectedDate) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateWithTime = dayjs(selectedDate)
        .hour(hours || 0)
        .minute(minutes || 0)
        .format('YYYY-MM-DD HH:mm');
      setValue('expiryValue', dateWithTime);
    }
  };

  // 时间选项
  const timeOptions = Array.from({ length: 24 })
    .map((_, hour) => {
      return [0, 30].map(minute => {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        return `${formattedHour}:${formattedMinute}`;
      });
    })
    .flat();

  // 渲染列表项的函数
  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'header') {
      return (
        <Box className="mb-3 p-3 bg-gray-100 rounded-lg mx-4">
          <Text className="text-lg font-semibold text-gray-800">设备 {item.deviceId}</Text>
          <Text className="text-sm text-gray-600">{item.passwordCount} 个临时密码</Text>
        </Box>
      );
    }

    if (item.type === 'password') {
      const password = item.password;
      return (
        <Box className="border rounded-lg bg-white overflow-hidden mx-4 ml-8 mb-3">
          <Box className="p-4">
            <HStack className="justify-between mb-2">
              <VStack>
                <Text className="font-medium">{password.name}</Text>
                <Text className="text-sm text-gray-500">密码: {password.password}</Text>
              </VStack>
              <HStack space="xs">
                <TouchableOpacity
                  className="p-1"
                  onPress={() => handleCopyCode(password.password, password.id)}
                >
                  {copied === password.id ? (
                    <Check size={20} color="#22c55e" />
                  ) : (
                    <Copy size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity className="p-1" onPress={() => handleDeleteConfirm(password.id)}>
                  <Trash2 size={20} color="#6b7280" />
                </TouchableOpacity>
              </HStack>
            </HStack>

            <HStack className="items-center gap-2">
              <Clock size={16} color="#6b7280" className="mr-1" />
              <Text className="text-sm text-gray-500">
                {password.expiresAt
                  ? `有效期至: ${dayjs(password.expiresAt).format('YYYY年MM月DD日')}`
                  : password.remainingUses !== null
                    ? `剩余使用次数: ${password.remainingUses}`
                    : '永久有效'}
              </Text>
            </HStack>
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Box className="flex-1 bg-gray-50">
      {/* 固定的头部 */}
      <Box className="px-4 py-6 bg-gray-50">
        <Box className="flex-row items-center justify-between mb-6">
          <Box className="flex-row items-center">
            <Link href="/" asChild>
              <Pressable className="mr-2">
                <ChevronLeft size={24} color="#000" />
              </Pressable>
            </Link>
            <Text className="text-xl font-bold">所有临时密码</Text>
          </Box>
          <TouchableOpacity
            className="h-10 w-10 rounded-full bg-primary items-center justify-center"
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </Box>
      </Box>

      {/* 列表内容 */}
      <Box className="flex-1">
        {isLoading ? (
          <Box className="items-center py-8 border rounded-lg bg-gray-50 mx-4">
            <Text className="text-gray-500">加载中...</Text>
          </Box>
        ) : isError ? (
          <Box className="items-center py-8 border rounded-lg bg-gray-50 mx-4">
            <Text className="text-red-500">加载失败</Text>
            <Button className="mt-4" onPress={() => refetch()}>
              <ButtonText>重试</ButtonText>
            </Button>
          </Box>
        ) : passwords.length === 0 ? (
          <Box className="items-center py-8 border rounded-lg bg-gray-50 mx-4">
            <Text className="text-gray-500">暂无临时密码</Text>
            <Button className="mt-4" onPress={() => setShowCreateModal(true)}>
              <ButtonText>创建临时密码</ButtonText>
            </Button>
          </Box>
        ) : (
          <FlashList
            data={flatListData}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            estimatedItemSize={120}
            onRefresh={onRefresh}
            refreshing={refreshing}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              isFetchingNextPage ? (
                <Box className="items-center py-4">
                  <Text className="text-gray-500">加载更多...</Text>
                </Box>
              ) : null
            }
          />
        )}
      </Box>

      {/* 创建密码模态框 */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} size="md">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">
              <Text>创建临时密码</Text>
            </Heading>
            <ModalCloseButton>
              <Icon as={X} size="sm" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <ScrollView>
              <VStack space="md" className="p-2">
                {/* 密码名称 */}
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, value } }) => (
                    <Box>
                      <Text className="mb-1 font-medium">密码名称</Text>
                      <Input>
                        <InputField
                          placeholder="例如: 清洁工, 快递员"
                          value={value}
                          onChangeText={onChange}
                        />
                      </Input>
                      {errors.name && (
                        <Text className="text-red-500 text-xs mt-1">{errors.name.message}</Text>
                      )}
                    </Box>
                  )}
                />

                {/* 设备ID */}
                <Controller
                  control={control}
                  name="deviceId"
                  render={({ field: { onChange, value } }) => (
                    <Box>
                      <Text className="mb-1 font-medium">设备ID</Text>
                      <Input>
                        <InputField
                          placeholder="请输入5位设备ID"
                          value={value}
                          onChangeText={onChange}
                          maxLength={5}
                        />
                      </Input>
                      {errors.deviceId && (
                        <Text className="text-red-500 text-xs mt-1">{errors.deviceId.message}</Text>
                      )}
                    </Box>
                  )}
                />

                {/* 密码 */}
                <Controller
                  control={control}
                  name="code"
                  render={({ field: { value, onChange } }) => (
                    <CreatePassword
                      value={value}
                      onChange={onChange}
                      errors={errors}
                      refreshPassword={password => {
                        setValue('code', password);
                      }}
                    />
                  )}
                />

                {/* 有效期类型 */}
                <Box>
                  <Text className="mb-1 font-medium">有效期类型</Text>
                  <HStack space="md">
                    <TouchableOpacity
                      className={`flex-1 py-2 rounded-lg border items-center ${
                        expiryType === 'time' ? 'bg-primary' : 'bg-white'
                      }`}
                      onPress={() => setValue('expiryType', 'time')}
                    >
                      <Text className={expiryType === 'time' ? 'text-white' : 'text-black'}>
                        时间限制
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`flex-1 py-2 rounded-lg border items-center ${
                        expiryType === 'usage' ? 'bg-primary' : 'bg-white'
                      }`}
                      onPress={() => setValue('expiryType', 'usage')}
                    >
                      <Text className={expiryType === 'usage' ? 'text-white' : 'text-black'}>
                        使用次数
                      </Text>
                    </TouchableOpacity>
                  </HStack>
                </Box>

                {/* 有效期至或使用次数 */}
                {expiryType === 'time' ? (
                  <Controller
                    control={control}
                    name="expiryValue"
                    render={({ field: { value } }) => (
                      <Box>
                        <Text className="mb-1 font-medium">有效期至</Text>
                        <TouchableOpacity
                          className="border rounded-lg p-2 flex-row items-center"
                          onPress={() => setShowDatePicker(true)}
                        >
                          <Icon as={Calendar} size="sm" className="mr-2 text-gray-500" />
                          <Text>{value}</Text>
                        </TouchableOpacity>

                        {/* 日期选择模态框 */}
                        <Modal
                          isOpen={showDatePicker}
                          onClose={() => setShowDatePicker(false)}
                          size="lg"
                        >
                          <ModalBackdrop />
                          <ModalContent>
                            <ModalHeader className="border-b border-gray-100">
                              <Text className="text-center font-medium">创建临时密码</Text>
                              <ModalCloseButton>
                                <X size={20} color="#9CA3AF" />
                              </ModalCloseButton>
                            </ModalHeader>
                            <ModalBody>
                              <VStack space="md" className="p-2">
                                <Text className="font-medium">有效期至</Text>
                                <DatePicker
                                  mode="single"
                                  locale="zh"
                                  date={selectedDate}
                                  onChange={params => handleDateChange(params.date)}
                                  style={styles.DatePicker}
                                  styles={customStyles}
                                />

                                <Text className="font-medium mt-4">时间</Text>
                                <ScrollView
                                  horizontal
                                  showsHorizontalScrollIndicator={false}
                                  className="pb-2"
                                >
                                  <HStack space="sm" className="flex-wrap">
                                    {timeOptions.map(time => (
                                      <TouchableOpacity
                                        key={time}
                                        className={`px-3 py-2 rounded-md border ${
                                          selectedTime === time
                                            ? 'bg-primary border-primary'
                                            : 'bg-white border-gray-200'
                                        }`}
                                        onPress={() => handleTimeChange(time)}
                                      >
                                        <Text
                                          className={
                                            selectedTime === time ? 'text-white' : 'text-gray-700'
                                          }
                                        >
                                          {time}
                                        </Text>
                                      </TouchableOpacity>
                                    ))}
                                  </HStack>
                                </ScrollView>
                              </VStack>
                            </ModalBody>
                            <ModalFooter className="border-t border-gray-200">
                              <HStack className="justify-between w-full">
                                <Button
                                  variant="outline"
                                  onPress={() => setShowDatePicker(false)}
                                  className="px-4"
                                >
                                  <Text>取消</Text>
                                </Button>
                                <Button
                                  onPress={() => {
                                    updateExpiryValue();
                                    setShowDatePicker(false);
                                  }}
                                  className="px-4 bg-primary"
                                >
                                  <Text className="text-white">确定</Text>
                                </Button>
                              </HStack>
                            </ModalFooter>
                          </ModalContent>
                        </Modal>
                      </Box>
                    )}
                  />
                ) : (
                  <Controller
                    control={control}
                    name="usageLimit"
                    render={({ field: { onChange, value } }) => (
                      <Box>
                        <Text className="mb-1 font-medium">使用次数限制</Text>
                        <Input>
                          <InputField
                            placeholder="例如: 3"
                            keyboardType="numeric"
                            value={value?.toString() || ''}
                            onChangeText={(text: string) =>
                              onChange(text ? parseInt(text, 10) : null)
                            }
                          />
                        </Input>
                      </Box>
                    )}
                  />
                )}
              </VStack>
            </ScrollView>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onPress={() => setShowCreateModal(false)} className="mr-2">
              <ButtonText>取消</ButtonText>
            </Button>
            <Button onPress={handleSubmit(handleCreatePassword)}>
              <ButtonText>创建</ButtonText>
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 删除确认模态框 */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} size="sm">
        <ModalBackdrop />
        <ModalContent>
          <ModalHeader>
            <Heading size="md">
              <Text>确认删除</Text>
            </Heading>
            <ModalCloseButton>
              <Icon as={X} size="sm" />
            </ModalCloseButton>
          </ModalHeader>
          <ModalBody>
            <VStack space="md" className="items-center p-4">
              <Box className="w-12 h-12 rounded-full bg-red-100 items-center justify-center mb-2">
                <AlertTriangle size={24} color="#EF4444" />
              </Box>
              <Text className="text-center font-medium">您确定要删除这个临时密码吗？</Text>
              <Text className="text-center text-gray-500 text-sm">
                删除后将无法恢复，已分享的密码将立即失效。
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack className="justify-between w-full">
              <Button
                variant="outline"
                onPress={() => setShowDeleteModal(false)}
                className="flex-1 mr-2"
              >
                <ButtonText>取消</ButtonText>
              </Button>
              <Button onPress={confirmDelete} className="flex-1 bg-red-500">
                <ButtonText>删除</ButtonText>
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

const styles = StyleSheet.create({
  DatePicker: {
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 8,
    borderWidth: 0,
  },
});
