import { zodResolver } from '@hookform/resolvers/zod';
import { X, Info, Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { ScrollView } from 'react-native';
import { z } from 'zod';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel } from '@/components/ui/checkbox';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Input, InputField } from '@/components/ui/input';
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal';
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
  SelectItem,
} from '@/components/ui/select';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { EmergencyContact } from '@/types/emergency-contact';

// 定义表单数据类型
type FormData = Omit<EmergencyContact, 'id'>;

// 表单验证规则
const formSchema = z.object({
  name: z.string().min(1, '请输入联系人姓名'),
  relationship: z.string().min(1, '请选择关系'),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  priority: z.number().min(1).max(5),
  notifyOnEvents: z.array(z.string()).min(1, '请至少选择一个通知事件'),
});

// 事件选项
const eventOptions = [
  { value: 'tamper', label: '防拆报警' },
  { value: 'forced_entry', label: '强行闯入' },
  { value: 'multiple_failed_attempts', label: '多次验证失败' },
  { value: 'low_battery', label: '电量不足' },
  { value: 'door_left_open', label: '门未关闭' },
];

// 关系选项
const relationshipOptions = [
  { value: '家人', label: '家人' },
  { value: '朋友', label: '朋友' },
  { value: '同事', label: '同事' },
  { value: '邻居', label: '邻居' },
  { value: '其他', label: '其他' },
];

interface EmergencyContactFormProps {
  contact?: EmergencyContact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: EmergencyContact) => void;
}

export function EmergencyContactForm({
  contact,
  isOpen,
  onClose,
  onSave,
}: EmergencyContactFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      relationship: '家人',
      phone: '',
      priority: 1,
      notifyOnEvents: ['tamper', 'forced_entry'],
    },
  });

  // 如果是编辑模式，设置表单初始值
  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        relationship: contact.relationship,
        phone: contact.phone,
        priority: contact.priority,
        notifyOnEvents: contact.notifyOnEvents,
      });
    }
  }, [contact, reset]);

  // 提交表单
  const onSubmitForm = (data: FormData) => {
    onSave({
      id: contact?.id || '',
      ...data,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size="md">{contact ? '编辑联系人' : '添加联系人'}</Heading>
          <ModalCloseButton>
            <Icon as={X} size="sm" />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <ScrollView>
            <VStack space="md" className="p-2">
              {/* 姓名 */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <Box>
                    <Text className="mb-1 font-medium">姓名</Text>
                    <Input>
                      <InputField
                        placeholder="请输入联系人姓名"
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

              {/* 关系 */}
              <Controller
                control={control}
                name="relationship"
                render={({ field: { onChange, value } }) => (
                  <Box>
                    <Text className="mb-1 font-medium">关系</Text>
                    <Select selectedValue={value} onValueChange={onChange}>
                      <SelectTrigger className="w-full h-10">
                        <SelectInput placeholder="请选择关系" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          {relationshipOptions.map(option => (
                            <SelectItem
                              key={option.value}
                              label={option.label}
                              value={option.value}
                            />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                    {errors.relationship && (
                      <Text className="text-red-500 text-xs">{errors.relationship.message}</Text>
                    )}
                  </Box>
                )}
              />

              {/* 手机号码 */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <Box>
                    <Text className="mb-1 font-medium">手机号码</Text>
                    <Input>
                      <InputField
                        placeholder="请输入手机号码"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="phone-pad"
                      />
                    </Input>
                    {errors.phone && (
                      <Text className="text-red-500 text-xs mt-1">{errors.phone.message}</Text>
                    )}
                  </Box>
                )}
              />

              {/* 优先级 */}
              <Controller
                control={control}
                name="priority"
                render={({ field: { onChange, value } }) => (
                  <Box>
                    <Text className="mb-1 font-medium">优先级</Text>
                    <Select
                      selectedValue={String(value)}
                      onValueChange={(val: string) => onChange(parseInt(val, 10))}
                    >
                      <SelectTrigger className="w-full h-10">
                        <SelectInput placeholder="请选择优先级" />
                      </SelectTrigger>
                      <SelectPortal>
                        <SelectBackdrop />
                        <SelectContent>
                          <SelectDragIndicatorWrapper>
                            <SelectDragIndicator />
                          </SelectDragIndicatorWrapper>
                          {[1, 2, 3, 4, 5].map(num => (
                            <SelectItem
                              key={num}
                              label={`${num}${num === 1 ? ' - 最高' : num === 5 ? ' - 最低' : ''}`}
                              value={String(num)}
                            />
                          ))}
                        </SelectContent>
                      </SelectPortal>
                    </Select>
                    <Text className="text-gray-500 text-xs mt-1">
                      优先级决定通知顺序，1为最高优先级
                    </Text>
                  </Box>
                )}
              />

              {/* 通知事件 */}
              <Controller
                control={control}
                name="notifyOnEvents"
                render={({ field: { onChange, value } }) => (
                  <Box>
                    <Text className="mb-2 font-medium">通知事件</Text>
                    <VStack space="sm">
                      {eventOptions.map(option => (
                        <Checkbox
                          key={option.value}
                          value={option.value}
                          isChecked={value.includes(option.value)}
                          onChange={() => {
                            const newValue = value.includes(option.value)
                              ? value.filter(v => v !== option.value)
                              : [...value, option.value];
                            onChange(newValue);
                          }}
                          size="md"
                        >
                          <CheckboxIndicator className="mr-2">
                            <CheckboxIcon as={Check} />
                          </CheckboxIndicator>
                          <CheckboxLabel>{option.label}</CheckboxLabel>
                        </Checkbox>
                      ))}
                    </VStack>
                    {errors.notifyOnEvents && (
                      <Text className="text-red-500 text-xs mt-1">
                        {errors.notifyOnEvents.message}
                      </Text>
                    )}
                  </Box>
                )}
              />

              {/* 提示信息 */}
              <Box className="bg-amber-100 rounded-md p-3 mt-2">
                <HStack space="sm" className="items-center">
                  <Icon as={Info} color="#d97706" size="sm" />
                  <Text size="xs" className="text-amber-800">
                    联系人将在选定的事件发生时收到通知。请确保手机号码正确无误。
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </ScrollView>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onPress={onClose} className="mr-2">
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleSubmit(onSubmitForm)}>
            <ButtonText>保存</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
