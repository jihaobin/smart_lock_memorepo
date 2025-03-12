import { Stack } from "expo-router";
import "../global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/toast-provider";
import Header from "@/components/header";

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <Stack
          screenOptions={{
            headerShown: true, // 修改为true以显示导航头部
            headerBackTitle: "返回", // 为返回按钮添加文字
            headerTintColor: "#E53E3E", // 设置返回按钮和标题颜色为蓝色
            headerStyle: {
              backgroundColor: "#ffffff", // 设置导航栏背景颜色为白色
            },
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              header: () => <Header />,
            }}
          />
          <Stack.Screen name="+not-found" />
          <Stack.Screen
            name="login/index"
            options={{
              title: "登录",
            }}
          />
          <Stack.Screen
            name="forgot-password/index"
            options={{
              title: "找回密码",
            }}
          />
          <Stack.Screen
            name="device-management/[id]"
            options={{
              title: "设备管理",
            }}
          />
          <Stack.Screen
            name="register/index"
            options={{
              title: "注册",
            }}
          />
          <Stack.Screen
            name="device-settings/[id]"
            options={{
              title: "设备设置",
            }}
          />
          <Stack.Screen
            name="access-logs/[id]"
            options={{
              title: "访问记录",
            }}
          />
          <Stack.Screen
            name="security-settings/[id]"
            options={{
              title: "安全设置",
            }}
          />
          <Stack.Screen
            name="global-settings/index"
            options={{
              title: "全局设置",
            }}
          />
          <Stack.Screen
            name="device-detail/[id]"
            options={{
              title: "设备详情",
            }}
          />
          <Stack.Screen
            name="emergency-contacts/[id]"
            options={{
              title: "紧急联系人",
            }}
          />
          <Stack.Screen
            name="firmware-update/[id]"
            options={{
              title: "固件更新",
            }}
          />
          <Stack.Screen
            name="factory-reset/[id]"
            options={{
              title: "恢复出厂设置",
            }}
          />
          <Stack.Screen
            name="temporary-passwords/index"
            options={{
              title: "临时密码",
            }}
          />
        </Stack>
        <ToastProvider />
      </AuthProvider>
    </GluestackUIProvider>
  );
}
