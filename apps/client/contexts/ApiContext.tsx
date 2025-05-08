import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiFactory,
  ApiClient,
  ReactNativeAdapter,
  createQueryHooks,
  IToaster,
  ReactNativeErrorHandler,
} from '@smart-lock/shared/api';
import { RelativePathString, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo } from 'react';

import { useAuth } from './AuthContext';

import { useToast } from '@/hooks/use-toast';
import queryClient from '@/lib/queryClient';

// 定义API上下文类型
interface ApiContextType {
  apiClient: ApiClient;
  queryHooks: ReturnType<typeof createQueryHooks>;
  clearApiState: () => Promise<void>;
}

// 创建上下文
const ApiContext = createContext<ApiContextType | undefined>(undefined);

// API提供者组件
export function ApiProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();

  class ToastAdapter implements IToaster {
    private toast;
    constructor() {
      this.toast = toast;
    }

    showError(message: string): void {
      this.toast({
        title: message,
        variant: 'destructive',
      });
    }

    showWarning(message: string): void {
      this.toast({
        title: message,
        variant: 'warning',
      });
    }

    showInfo(message: string): void {
      this.toast({
        title: message,
        variant: 'info',
      });
    }

    showSuccess(message: string): void {
      this.toast({
        title: message,
        variant: 'success',
      });
    }
  }

  const router = useRouter();
  const { token } = useAuth();

  // 创建React Native适配器
  const adapter = useMemo(
    () =>
      new ReactNativeAdapter(AsyncStorage, {
        navigate: (routeName: string, params?: Record<string, unknown>) => {
          if (params) {
            // 使用类型断言处理
            router.push({
              pathname: routeName as RelativePathString,
              params: params as Record<string, string>,
            });
          } else {
            router.push(routeName as RelativePathString);
          }
        },
        goBack: () => router.back(),
        reset: (state: {
          routes: Array<{
            name: string;
            params?: Record<string, unknown>;
          }>;
          index: number;
        }) => {
          // expo-router目前没有直接等价的reset方法
          router.replace(state.routes[state.index].name as RelativePathString);
        },
      }),
    [router]
  );

  // 创建Toast实例
  const toastAdapter = useMemo(() => new ToastAdapter(), [toast]);

  // 创建错误处理器
  const errorHandler = useMemo(
    () =>
      new ReactNativeErrorHandler({
        toaster: toastAdapter,
        logErrors: true,
      }),
    [toastAdapter]
  );

  // 使用API工厂创建客户端
  const apiClient = React.useMemo(() => {
    return ApiFactory.createClient({
      adapter,
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.112:3000',
      options: {
        tokenKey: 'auth_token', // 认证令牌的存储键
        refreshTokenKey: 'refresh_token', // 刷新令牌的存储键
        loginPath: 'login', // 登录路由路径
      },
      errorHandler,
    });
  }, [adapter, errorHandler]);

  // 当token改变时更新Authorization头
  useEffect(() => {
    // 使用ApiClient提供的公开方法设置认证令牌
    if (apiClient && token) {
      void apiClient.setAuthToken(token).then(() => {
        queryClient.invalidateQueries();
      });
    } else if (apiClient && token === null) {
      console.log('清楚用户登录');
      // 当token变为null时清除认证状态
      void apiClient.clearAuth();
      // 取消所有正在进行的查询
      queryClient.cancelQueries();
      // 重置查询缓存
      queryClient.clear();
    }
  }, [token, apiClient]);

  // 清除API状态的方法
  const clearApiState = React.useCallback(async (): Promise<void> => {
    if (apiClient) {
      // 清除API客户端的认证状态
      await apiClient.clearAuth();
    }

    // 取消所有正在进行的查询
    queryClient.cancelQueries();

    // 使所有查询失效（标记为 stale）
    queryClient.invalidateQueries();

    // 重置所有查询到初始状态
    queryClient.resetQueries();

    // 清除React Query缓存
    queryClient.clear();

    // 重定向到登录页面
    router.replace('/login');
  }, [apiClient, router]);

  // 创建查询hooks
  const queryHooks = React.useMemo(() => {
    return createQueryHooks(apiClient);
  }, [apiClient]);

  // 创建上下文值
  const contextValue = React.useMemo(
    () => ({ apiClient, queryHooks, clearApiState }),
    [apiClient, queryHooks, clearApiState]
  );

  return <ApiContext.Provider value={contextValue}>{children}</ApiContext.Provider>;
}

// 用于访问API上下文的hooks
export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
