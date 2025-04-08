import { ForgotPasswordSchemaType, IAuthResponse, LoginSchemaType, RegisterSchemaType, VerifyCodeSchemaType } from '@smart-lock/shared/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';

// // 扩展ApiClient类型声明以包含新增的方法
// declare module '@smart-lock/shared' {
//   interface ApiClient {
//     setAuthToken(token: string | null): Promise<void>;
//     setRefreshToken(refreshToken: string | null): Promise<void>;
//     getAuthToken(): Promise<string | null>;
//     getRefreshToken(): Promise<string | null>;
//     clearAuth(): Promise<void>;
//   }
// }

import { useApi } from '../contexts/ApiContext';
import { useAuth as useAuthContext } from '../contexts/AuthContext';

// 响应类型定义
interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

interface ResetResponse {
  success: boolean;
  message?: string;
}

export function useAuthApi() {
  const { apiClient } = useApi();
  const { login: setAuth, logout: contextLogout } = useAuthContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 登录
  const login = async (data: LoginSchemaType) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<IAuthResponse>('/auth/login', data);

      console.info('Loginresponse', response);

      if (response.access_token) {
        // 使用ApiClient提供的方法设置令牌
        await apiClient.setAuthToken(response.access_token);

        // 设置刷新令牌（如果有）
        if (response.refresh_token) {
          await apiClient.setRefreshToken(response.refresh_token);
        }

        // 更新AuthContext中的用户信息
        setAuth({
          id: response.user.id,
          email: response.user.email,
          nikeName: response.user.nikeName,
        });

        router.replace('/');
        return response;
      } else {
        throw new Error('登录失败：无效的响应格式');
      }
    } catch (err) {
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
      await apiClient.clearAuth();

      // 清除AuthContext中的用户信息
      contextLogout();

      // 重定向到登录页面
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登出失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 注册
  const register = async (data: RegisterSchemaType) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<IAuthResponse>('/auth/register', data);

      console.info('Registerresponse', response);

      if (response.access_token) {
        // 使用ApiClient提供的方法设置令牌
        await apiClient.setAuthToken(response.access_token);

        // 设置刷新令牌（如果有）
        if (response.refresh_token) {
          await apiClient.setRefreshToken(response.refresh_token);
        }

        // 更新AuthContext中的用户信息
        setAuth({
          id: response.user.id,
          email: response.user.email,
          nikeName: response.user.nikeName,
        });

        router.replace('/');
        return response;
      } else {
        throw new Error('注册失败：无效的响应格式');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 忘记密码 - 发送重置邮件
  const forgotPassword = async (data: ForgotPasswordSchemaType) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<ResetResponse>('/auth/forgot-password', data);

      if (response.success) {
        return response;
      } else {
        throw new Error('发送重置邮件失败：' + (response.message || '请重试'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送重置邮件失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const sendVerificationCode = async (data: VerifyCodeSchemaType) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post<string>('/auth/send_verification_code', data);

      if (response) {
        return response;
      } else {
        throw new Error('发送验证码失败：' + (response || '请重试'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败，请重试');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    register,
    forgotPassword,
    sendVerificationCode,
    loading,
    error
  };
}