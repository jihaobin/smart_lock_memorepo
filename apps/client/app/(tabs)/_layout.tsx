import Header from "@/components/header";
import { Tabs } from "expo-router";
import { Home, User, Bell, Key, Settings } from "lucide-react-native";
import { View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 64,
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#E53E3E",
        },
        headerShown: false,
        headerTintColor: "#E53E3E",
        tabBarActiveTintColor: "#E53E3E",
        tabBarInactiveTintColor: "#9CA3AF",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "首页",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="remote-unlock"
        options={{
          title: "远程开锁",
          tabBarIcon: ({ color, size }) => <Key color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "通知",
          tabBarIcon: ({ color, size }) => <Bell color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="user-management/index"
        options={{
          title: "用户",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="device-management/index"
        options={{
          title: "设备",
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
