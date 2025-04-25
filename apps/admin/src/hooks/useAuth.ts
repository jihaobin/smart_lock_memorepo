/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IAdminAuthResponse, LoginSchemaType } from '@smart-lock/shared/shared';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { useAuth as useAuthContext } from '../context/AuthContext';

// 定义ApiClient接口
import apiClient from '@/lib/aip-service';

// 定义ApiClient类型，确保TypeScript识别其方法
interface ApiClient {
  post<T>(url: string, data: unknown): Promise<T>;
  setAuthToken(token: string): Promise<void>;
  setRefreshToken(token: string): Promise<void>;
  clearAuth(): Promise<void>;
}

// 断言apiClient为ApiClient类型
const typedApiClient = apiClient as ApiClient;

export function useAuthApi() {
  const { login: setAuth, logout: contextLogout } = useAuthContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 登录
  const login = async (data: LoginSchemaType) => {
    try {
      setLoading(true);
      setError(null);

      const response = await typedApiClient.post<IAdminAuthResponse>('/auth/login', {
        name: data.phone,
        password: data.password,
        rememberMe: data.rememberMe,
      });

      if (response.access_token) {
        // 使用ApiClient提供的方法设置令牌
        await typedApiClient.setAuthToken(response.access_token);

        // 设置刷新令牌（如果有）
        if (response.refresh_token) {
          await typedApiClient.setRefreshToken(response.refresh_token);
        }

        // 更新AuthContext中的用户信息
        setAuth({
          id: response.user.id,
          name: response.user.name,
          roles: response.user.roles,
          accessibleRoutes: response.user.accessibleRoutes
        });

        navigate({ to: '/', replace: true });
        return response;
      } else {
        throw new Error('登录失败：无效的响应格式');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const logout = async () => {
    try {
      setLoading(true);

      // 清除ApiClient中的认证信息
      await typedApiClient.clearAuth();

      // 清除AuthContext中的用户信息
      contextLogout();

      // 重定向到登录页面
      navigate({ to: '/login', replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登出失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    loading,
    error
  };
}