import { RefreshCw } from 'lucide-react-native';
import { FieldError } from 'react-hook-form';
import { TouchableOpacity, Text } from 'react-native';

import { Box } from './ui/box';
import { Input, InputField, InputSlot } from './ui/input';

interface CreatePasswordProps {
  value: string;
  onChange: (value: string) => void;
  errors?: {
    code?: FieldError;
  };
  refreshPassword: (genPassword: string) => void;
  placeholder?: string;
}

const generateNewCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export default function CreatePassword({
  value,
  onChange,
  errors,
  refreshPassword,
  placeholder = '输入6位数字密码',
}: CreatePasswordProps) {
  return (
    <Box className="mt-2 gap-2">
      <Text className="mb-1 font-medium">密码</Text>
      <Box className="flex-row">
        <Input className="flex-1 rounded-l-lg">
          <InputField
            value={value}
            onChangeText={(text: string) => {
              // 只允许输入数字，并限制长度为6位
              const numericText = text.replace(/[^0-9]/g, '');
              if (numericText.length <= 6) {
                onChange(numericText);
              }
            }}
            keyboardType="numeric"
            maxLength={6}
            placeholder={placeholder}
          />
          <InputSlot>
            <TouchableOpacity
              onPress={() => {
                refreshPassword(generateNewCode());
              }}
              className="w-12 h-12 border border-l-0 border-gray-200 rounded-r-lg bg-gray-50 items-center justify-center"
            >
              <RefreshCw size={20} color="#6b7280" />
            </TouchableOpacity>
          </InputSlot>
        </Input>
      </Box>
      {errors?.code && <Text className="text-red-500 text-xs mt-1">{errors.code.message}</Text>}
    </Box>
  );
}
