import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";

export default function Home() {
  const { toast } = useToast();

  const showDefaultToast = () => {
    toast({
      title: "标准提示",
      description: "这是一个标准提示消息。",
    });
  };

  const showSuccessToast = () => {
    toast({
      title: "操作成功",
      description: "您的操作已成功完成！",
      variant: "success",
    });
  };

  const showErrorToast = () => {
    toast({
      title: "出错了",
      description: "处理您的请求时发生错误。",
      variant: "destructive",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <VStack space="md" style={styles.content}>
          <Text className="text-xl font-bold mb-4">Toast 消息演示</Text>

          <Button onPress={showDefaultToast} className="mb-3">
            <Text>显示默认提示</Text>
          </Button>

          <Button variant="outline" onPress={showSuccessToast} className="mb-3">
            <Text style={{ color: "#22c55e" }}>显示成功提示</Text>
          </Button>

          <Button variant="outline" onPress={showErrorToast}>
            <Text style={{ color: "#ef4444" }}>显示错误提示</Text>
          </Button>
        </VStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
