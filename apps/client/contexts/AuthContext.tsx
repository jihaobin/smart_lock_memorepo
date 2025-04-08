'use client';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { IUser } from '@smart-lock/shared/shared';
import type React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';

// 在当前文件不直接导入ApiClient，避免循环依赖

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  login: (user: IUser) => void;
  logout: () => void;
  isLoading: boolean;
  setToken: (token: string | null) => void;
}

// 使用常量定义存储键，保持一致性
const AUTH_USER_KEY = 'user';
const AUTH_TOKEN_KEY = 'auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查保存的用户信息和token
    const loadAuth = async () => {
      try {
        setIsLoading(true);
        const [savedUser, savedToken] = await Promise.all([
          AsyncStorage.getItem(AUTH_USER_KEY),
          AsyncStorage.getItem(AUTH_TOKEN_KEY),
        ]);

        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        if (savedToken) {
          setToken(savedToken);
        }
      } catch (error) {
        console.error('加载认证信息失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (userData: IUser) => {
    setUser(userData);
    try {
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));

      // 注意：我们不在此处设置token，
      // token的设置由useAuth.ts中的login函数通过ApiClient来处理
    } catch (error) {
      console.error('保存用户信息失败:', error);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      // 令牌的清除由ApiClient.clearAuth处理，这里只清除用户信息
    } catch (error) {
      console.error('清除用户信息失败:', error);
    }

    // ApiClient的clearAuth方法会在logout后被调用
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
