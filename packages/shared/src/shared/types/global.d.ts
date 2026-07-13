// 全局环境变量类型扩展
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare namespace NodeJS {
  interface ProcessEnv {
    // Expo环境变量
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_SOCKET_URL?: string;
    EXPO_PUBLIC_NOTICATION?: string;
    [key: string]: string | undefined;
  }
}

// 全局React Native类型扩展
declare global {
  // Expo Constants类型
  namespace Expo {
    interface Constants {
      expoConfig?: {
        extra?: {
          apiUrl?: string;
          [key: string]: unknown;
        };
      };
    }
  }

  // 为全局对象添加Expo属性
  var expo: {
    Constants?: {
      expoConfig?: {
        extra?: {
          apiUrl?: string;
          [key: string]: unknown;
        };
      };
    };
  };

  // React Native AsyncStorage类型兼容
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

export {};
