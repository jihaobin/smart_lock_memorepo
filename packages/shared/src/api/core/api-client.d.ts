// ApiClient类型声明文件
import { AxiosRequestConfig, AxiosInstance } from 'axios';

import { PaginatedData } from '../../shared/types/common';
import { PlatformAdapter } from '../adapters/platform-adapter';

// API客户端配置类型
export interface ApiClientConfig extends Omit<AxiosRequestConfig, 'adapter'> {
  platformAdapter: PlatformAdapter;
  tokenKey?: string;
  refreshTokenKey?: string;
  loginPath?: string;
}

// API客户端类型
export declare class ApiClient {
  protected axiosInstance: AxiosInstance;
  protected platformAdapter: PlatformAdapter;
  protected config: ApiClientConfig;

  constructor(config: ApiClientConfig);

  // 认证相关方法
  setAuthToken(token: string | null): Promise<void>;
  setRefreshToken(refreshToken: string | null): Promise<void>;
  getAuthToken(): Promise<string | null>;
  getRefreshToken(): Promise<string | null>;
  clearAuth(): Promise<void>;

  // HTTP请求方法
  request<T>(config: AxiosRequestConfig): Promise<T>;
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
  put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
  patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  getPage<T>(
    url: string,
    params?: { page?: number; limit?: number; [key: string]: unknown },
    config?: AxiosRequestConfig
  ): Promise<PaginatedData<T>>;
}