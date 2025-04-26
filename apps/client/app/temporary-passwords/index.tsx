'use client';

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
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView, Pressable, TouchableOpacity, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import DatePicker, { DateType, useDefaultStyles } from 'react-native-ui-datepicker';
import 'dayjs/locale/zh-cn';
import { z } from 'zod';

// 导入本地Gluestack UI组件
import CreatePassword from '@/components/create_password';
import { Badge, BadgeText } from '@/components/ui/badge';
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

// 配置dayjs
dayjs.locale('zh-cn');

// 定义表单验证Schema
const passwordFormSchema = z.object({
  name: z.string().min(1, '密码名称不能为空'),
  code: z.string().length(6, '密码必须是6位数字'),
  expiryType: z.enum(['time', 'usage']),
  expiryValue: z.string().nullable(),
  usageLimit: z.number().nullable(),
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

type PasswordType = {
  id: number;
  code: string;
  name: string;
  expiryType: 'time' | 'usage';
  expiryValue: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
};

type TemporaryPasswordsProps = {
  deviceId?: string;
};

export default function TemporaryPasswords({ deviceId }: TemporaryPasswordsProps) {
  const toast = useToast();
  const [passwords, setPasswords] = useState<PasswordType[]>([
    {
      id: 1,
      code: '123456',
      name: '清洁工',
      expiryType: 'time',
      expiryValue: '2023-12-31 18:00',
      usageLimit: null,
      usageCount: 0,
      isActive: true,
    },
    {
      id: 2,
      code: '789012',
      name: '快递员',
      expiryType: 'usage',
      expiryValue: null,
      usageLimit: 3,
      usageCount: 1,
      isActive: true,
    },
  ]);

  const [filteredPasswords, setFilteredPasswords] = useState<PasswordType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
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
      expiryType: 'time',
      expiryValue: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'),
      usageLimit: null,
    },
  });

  const expiryType = watch('expiryType');

  // 根据设备ID过滤密码
  useEffect(() => {
    if (deviceId) {
      // 这里应该是从API获取特定设备的密码
      // 目前只是模拟，实际应用中应该根据deviceId从后端获取数据
      setFilteredPasswords(passwords);
    } else {
      setFilteredPasswords(passwords);
    }
  }, [deviceId, passwords]);

  const handleCreatePassword = (data: PasswordFormValues) => {
    const newPassword: PasswordType = {
      id: passwords.length + 1,
      code: data.code,
      name: data.name,
      expiryType: data.expiryType,
      expiryValue: data.expiryValue,
      usageLimit: data.usageLimit,
      usageCount: 0,
      isActive: true,
    };

    setPasswords([...passwords, newPassword]);
    setShowCreateModal(false);
    reset({
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      name: '',
      expiryType: 'time',
      expiryValue: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm'),
      usageLimit: null,
    });
  };

  const handleCopyCode = async (id: number, code: string) => {
    await Clipboard.setStringAsync(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.toast({
      variant: 'success',
      title: '密码已复制到剪贴板',
    });
  };

  // 显示删除确认模态框
  const handleDeleteConfirm = (id: number) => {
    setPasswordToDelete(id);
    setShowDeleteModal(true);
  };

  // 确认删除密码
  const confirmDelete = () => {
    if (passwordToDelete !== null) {
      setPasswords(passwords.filter(password => password.id !== passwordToDelete));
      setShowDeleteModal(false);
      setPasswordToDelete(null);
      toast.toast({
        variant: 'success',
        title: '临时密码已删除',
      });
    }
  };

  // const generateNewCode = () => {
  //   setValue('code', Math.floor(100000 + Math.random() * 900000).toString());
  // };

  const handleDateChange = (date: DateType) => {
    if (date && date.date) {
      setSelectedDate(date.date);
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

  return (
    <Box className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-4 py-6">
        <Box className="flex-row items-center justify-between mb-6">
          <Box className="flex-row items-center">
            <Link href="/" asChild>
              <Pressable className="mr-2">
                <ChevronLeft size={24} color="#000" />
              </Pressable>
            </Link>
            <Text className="text-xl font-bold">临时密码</Text>
            {deviceId && <Text className="ml-2 text-sm text-gray-500">设备ID: {deviceId}</Text>}
          </Box>
          <TouchableOpacity
            className="h-10 w-10 rounded-full bg-primary items-center justify-center"
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </Box>

        <Box className="mb-6">
          <Text className="text-lg font-medium mb-3">活跃密码</Text>

          {filteredPasswords.length === 0 ? (
            <Box className="items-center py-8 border rounded-lg bg-gray-50">
              <Text className="text-gray-500">暂无临时密码</Text>
              <Button className="mt-4" onPress={() => setShowCreateModal(true)}>
                <ButtonText>创建临时密码</ButtonText>
              </Button>
            </Box>
          ) : (
            <VStack space="md">
              {filteredPasswords.map(password => (
                <Box key={password.id} className="border rounded-lg bg-white overflow-hidden">
                  <Box className="p-4">
                    <HStack className="justify-between mb-2">
                      <Text className="font-medium">{password.name}</Text>
                      <HStack space="xs">
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => handleCopyCode(password.id, password.code)}
                        >
                          {copied === password.id ? (
                            <Check size={20} color="#22c55e" />
                          ) : (
                            <Copy size={20} color="#6b7280" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="p-1"
                          onPress={() => handleDeleteConfirm(password.id)}
                        >
                          <Trash2 size={20} color="#6b7280" />
                        </TouchableOpacity>
                      </HStack>
                    </HStack>

                    <HStack className="justify-between mb-3">
                      <Text className="text-2xl font-bold tracking-wider">{password.code}</Text>
                      <Badge className="bg-green-100">
                        <BadgeText className="text-green-800">
                          <Text>活跃</Text>
                        </BadgeText>
                      </Badge>
                    </HStack>

                    <HStack className="items-center">
                      <Clock size={16} color="#6b7280" className="mr-1" />
                      <Text className="text-sm text-gray-500">
                        {password.expiryType === 'time'
                          ? `有效期至: ${password.expiryValue}`
                          : `使用次数: ${password.usageCount}/${password.usageLimit}`}
                      </Text>
                    </HStack>
                  </Box>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </ScrollView>

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
                                  onChange={handleDateChange}
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
