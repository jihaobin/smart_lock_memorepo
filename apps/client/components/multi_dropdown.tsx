// @ts-ignore - MultiSelect组件类型定义与实际使用存在冲突，但功能正常
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MultiSelect } from 'react-native-element-dropdown';
// @ts-ignore
import AntDesign from 'react-native-vector-icons/AntDesign';

interface ItemType {
  label: string;
  value: string;
}

interface MultiDropdownProps {
  data: ItemType[];
  placeholder?: string;
  searchPlaceholder?: string;
  onChange: (items: string[]) => void;
  onDeleteItem: (item: ItemType) => void;
  value: string[];
  labelField?: string;
  valueField?: string;
  search?: boolean;
  style?: object;
  className?: string;
}

const MultiDropdown: React.FC<MultiDropdownProps> = ({
  data,
  placeholder = '请选择',
  searchPlaceholder = '搜索...',
  onChange,
  onDeleteItem,
  value,
  labelField = 'label',
  valueField = 'value',
  search = true,
  style,
  className,
}) => {
  const renderItem = (item: ItemType) => {
    return (
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-sm text-typography-900">{item.label}</Text>
        <AntDesign className="mr-1" color="#E53E3E" name="Safety" size={20} />
      </View>
    );
  };

  return (
    <View className={`w-full ${className || ''}`}>
      {/* @ts-ignore - MultiSelect组件类型定义问题 */}
      <MultiSelect
        style={[
          {
            height: 50,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 10,
            padding: 12,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 1,
          },
          style,
        ]}
        placeholderStyle={{
          fontSize: 16,
          color: '#718096',
        }}
        selectedTextStyle={{
          fontSize: 14,
          color: '#2D3748',
        }}
        inputSearchStyle={{
          height: 40,
          fontSize: 16,
          borderRadius: 8,
          borderColor: '#E2E8F0',
        }}
        iconStyle={{
          width: 20,
          height: 20,
        }}
        data={data}
        labelField={labelField}
        valueField={valueField}
        placeholder={placeholder}
        value={value}
        search={search}
        searchPlaceholder={searchPlaceholder}
        onChange={onChange}
        renderLeftIcon={() => (
          <AntDesign style={{ marginRight: 5 }} color="#E53E3E" name="Safety" size={20} />
        )}
        renderItem={renderItem}
        renderSelectedItem={(item, unSelect) => (
          <TouchableOpacity
            onPress={() => {
              if (unSelect) {
                unSelect(item);
              }
              if (onDeleteItem) {
                console.log('删除元素', item);
                onDeleteItem(item);
              }
            }}
          >
            <View className="flex-row justify-center items-center rounded-2xl bg-white shadow-sm mt-2 mr-3 px-3 py-2">
              <Text className="mr-1 text-base text-typography-900">{item.label}</Text>
              <AntDesign color="#E53E3E" name="delete" size={17} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default MultiDropdown;
