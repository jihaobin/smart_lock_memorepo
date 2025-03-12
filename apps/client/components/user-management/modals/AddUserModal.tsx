import React from "react";
import { ChevronLeft, X } from "lucide-react-native";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";
import { Icon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectItem,
  SelectBackdrop,
  SelectDragIndicatorWrapper,
  SelectDragIndicator,
} from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Group, AuthorizedUser } from "@/types/user-management";

// 定义表单验证模式
const addUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  email: z.string().email("请输入有效的电子邮箱").or(z.string().length(0)),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号码").or(z.string().length(0)),
  group: z.string().min(1, "请选择分组"),
});

// 推导表单数据类型
type AddUserFormData = z.infer<typeof addUserSchema>;

interface AddUserModalProps {
  showAddUserDialog: boolean;
  setShowAddUserDialog: (show: boolean) => void;
  newUser: Partial<AuthorizedUser>;
  setNewUser: (user: Partial<AuthorizedUser>) => void;
  groups: Group[];
  handleAddUser: () => void;
}

export function AddUserModal({
  showAddUserDialog,
  setShowAddUserDialog,
  newUser,
  setNewUser,
  groups,
  handleAddUser,
}: AddUserModalProps) {
  // 初始化 react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: newUser.name || "",
      email: newUser.email || "",
      phone: newUser.phone || "",
      group: newUser.group || "",
    },
  });

  // 处理表单提交
  const onSubmit = (data: AddUserFormData) => {
    setNewUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      group: data.group,
    });
    handleAddUser();
  };

  // 当对话框关闭时重置表单
  React.useEffect(() => {
    if (!showAddUserDialog) {
      reset();
    } else {
      // 当对话框打开时，使用当前的 newUser 值重置表单
      reset({
        name: newUser.name || "",
        email: newUser.email || "",
        phone: newUser.phone || "",
        group: newUser.group || "",
      });
    }
  }, [showAddUserDialog, newUser, reset]);

  return (
    <Modal isOpen={showAddUserDialog} onClose={() => setShowAddUserDialog(false)}>
      <ModalBackdrop />
      <ModalContent className="max-w-md">
        <ModalHeader>
          <Text className="text-lg font-bold">添加新用户</Text>
          <ModalCloseButton>
            <Icon as={X} />
          </ModalCloseButton>
        </ModalHeader>
        <ModalBody>
          <VStack className="space-y-4 py-4">
            <VStack className="space-y-2">
              <Text className="text-gray-700">姓名</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input isInvalid={!!errors.name}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="请输入姓名"
                    />
                  </Input>
                )}
              />
              {errors.name && (
                <Text className="text-sm text-red-500">{errors.name.message}</Text>
              )}
            </VStack>
            
            <VStack className="space-y-2">
              <Text className="text-gray-700">电子邮箱</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input isInvalid={!!errors.email}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="email-address"
                      placeholder="请输入电子邮箱"
                    />
                  </Input>
                )}
              />
              {errors.email && (
                <Text className="text-sm text-red-500">{errors.email.message}</Text>
              )}
            </VStack>
            
            <VStack className="space-y-2">
              <Text className="text-gray-700">手机号码</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input isInvalid={!!errors.phone}>
                    <InputField
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      placeholder="请输入手机号码"
                    />
                  </Input>
                )}
              />
              {errors.phone && (
                <Text className="text-sm text-red-500">{errors.phone.message}</Text>
              )}
            </VStack>
            
            <VStack className="space-y-2">
              <Text className="text-gray-700">用户分组</Text>
              <Controller
                control={control}
                name="group"
                render={({ field: { onChange, value } }) => (
                  <Select
                    selectedValue={value}
                    onValueChange={onChange}
                  >
                    <SelectTrigger>
                      <SelectInput placeholder="选择分组" />
                      <SelectIcon />
                    </SelectTrigger>
                    <SelectPortal>
                      <SelectBackdrop />
                      <SelectContent>
                        <SelectDragIndicatorWrapper>
                          <SelectDragIndicator />
                        </SelectDragIndicatorWrapper>
                        {groups.map((group) => (
                          <SelectItem
                            key={group.id}
                            label={group.name}
                            value={group.id}
                            className="p-3"
                          />
                        ))}
                      </SelectContent>
                    </SelectPortal>
                  </Select>
                )}
              />
            </VStack>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onPress={() => setShowAddUserDialog(false)}
            className="mr-2"
          >
            <ButtonText>取消</ButtonText>
          </Button>
          <Button onPress={handleSubmit(onSubmit)}>
            <ButtonText>添加用户</ButtonText>
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
