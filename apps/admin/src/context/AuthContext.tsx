import { AdminAuthUser, RouteItem } from '@smart-lock/shared/shared';
import type React from 'react';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/aip-service';

import {
  flattenRoutes,
  checkPermission,
  loadAuthFromStorage,
  saveUserToStorage,
  clearUserFromStorage,
} from './authUtils';

interface AuthContextType {
  user: AdminAuthUser | null;
  token: string | null;
  login: (user: AdminAuthUser) => void;
  logout: () => void;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  accessibleRoutes: RouteItem[];
  hasPermission: (routePath: string) => boolean;
  refreshUserRoutes: () => Promise<void>;
}

// 常量已移至authUtils.ts

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminAuthUser | null>(null);
  const [accessibleRoutes, setAccessibleRoutes] = useState<RouteItem[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const flattenedRoutes = useMemo((): RouteItem[] => {
    return flattenRoutes(accessibleRoutes);
  }, [accessibleRoutes]);

  useEffect(() => {
    // 检查保存的用户信息和token
    const loadAuth = async () => {
      try {
        setIsLoading(true);
        const { userData, token: savedToken } = loadAuthFromStorage();

        if (userData) {
          setUser(userData);
          setAccessibleRoutes(userData.accessibleRoutes);
        }

        if (savedToken) {
          setToken(savedToken);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = async (userData: AdminAuthUser) => {
    setUser(userData);
    setAccessibleRoutes(userData.accessibleRoutes);
    saveUserToStorage(userData);

    // 注意：我们不在此处设置token
    // token的设置由useAuth.ts中的login函数通过ApiClient来处理
  };

  // 刷新用户权限路由
  const refreshUserRoutes = async () => {
    if (!user) return;

    try {
      const routes = await apiClient.get<RouteItem[]>(`/rbac/users/${user.id}/accessible-routes`);
      const updatedUser = { ...user, accessibleRoutes: routes };
      setUser(updatedUser);
      setAccessibleRoutes(routes);
      saveUserToStorage(updatedUser);
    } catch (error) {
      console.error('刷新用户权限路由失败:', error);
    }
  };

  const hasPermission = (routePath: string) => {
    return checkPermission(user, routePath, flattenedRoutes);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    clearUserFromStorage();

    // ApiClient的clearAuth方法会在logout后被调用
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isLoading,
        setToken,
        accessibleRoutes,
        hasPermission,
        refreshUserRoutes,
      }}
    >
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
