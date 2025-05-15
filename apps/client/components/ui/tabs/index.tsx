'use client';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import React, { createContext, useContext, useState } from 'react';
import { View, Pressable } from 'react-native';

import { Text } from '../text';

// 创建Tabs上下文
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs组件必须在TabsProvider内部使用');
  }
  return context;
}

// 样式定义
const tabsStyle = tva({
  base: 'w-full',
});

const tabsListStyle = tva({
  base: 'flex flex-row bg-gray-100 rounded-lg p-1',
  variants: {
    fullWidth: {
      true: 'justify-between',
      false: 'justify-start',
    },
  },
  defaultVariants: {
    fullWidth: false,
  },
});

const tabsTriggerStyle = tva({
  base: 'px-3 py-2 rounded-md',
  variants: {
    state: {
      active: 'bg-white shadow',
      inactive: 'bg-transparent',
    },
  },
  defaultVariants: {
    state: 'inactive',
  },
});

const tabsContentStyle = tva({
  base: 'w-full',
});

// 组件定义
interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View className={tabsStyle({ class: className })}>{children}</View>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

function TabsList({ children, className, fullWidth }: TabsListProps) {
  return <View className={tabsListStyle({ fullWidth, class: className })}>{children}</View>;
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = value === selectedValue;

  return (
    <Pressable
      className={tabsTriggerStyle({
        state: isActive ? 'active' : 'inactive',
        class: className,
      })}
      onPress={() => onValueChange(value)}
    >
      {typeof children === 'string' ? (
        <Text className={`text-sm font-medium ${isActive ? 'text-primary-600' : 'text-gray-600'}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext();
  const isSelected = value === selectedValue;

  if (!isSelected) {
    return null;
  }

  return <View className={tabsContentStyle({ class: className })}>{children}</View>;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
