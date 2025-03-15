import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useToast } from '@/hooks/use-toast';
export default function Home() {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast({
      title: '标准提示',
      description: '这是一个标准提示消息。',
    });
  };

  const showSuccessToast = () => {
    toast({
      title: '操作成功',
      description: '您的操作已成功完成！',
      variant: 'success',
    });
  };

  const showErrorToast = () => {
    toast({
      title: '出错了',
      description: '处理您的请求时发生错误。',
      variant: 'destructive',
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <VStack space="md" className="p-4">
          <Text className="text-xl font-bold mb-4">Toast 消息演示</Text>

          <Button onPress={showDefaultToast} className="mb-3">
            <Text>显示默认提示</Text>
          </Button>

          <Button variant="outline" onPress={showSuccessToast} className="mb-3">
            <Text assName="text-green-500">显示成功提示</Text>
          </Button>

          <Button variant="outline" onPress={showErrorToast}>
            <Text assName="text-red-500">显示错误提示</Text>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}
