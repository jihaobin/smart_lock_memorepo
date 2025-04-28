import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

import { BaseErrorHandler } from './base-error-handler';
import { ApiResponse, ApiStatusCode, ErrorCode, PaginatedData } from '../../shared/types/common';
import { PlatformAdapter } from '../adapters/platform-adapter';
import { IErrorHandler } from '../types/error-handler';

// 自定义错误类型
interface ApiError extends Error {
  code: number;
  data: unknown;
  response?: AxiosResponse<ApiResponse<unknown>>;
}

/**
 * API客户端配置
 */
export interface ApiClientConfig extends Omit<AxiosRequestConfig, 'adapter'> {
  /**
   * 平台适配器
   */
  platformAdapter: PlatformAdapter;

  /**
   * 认证令牌存储键
   */
  tokenKey?: string;

  /**
   * 刷新令牌存储键
   */
  refreshTokenKey?: string;

  /**
   * 登录路径
   */
  loginPath?: string;

  /**
   * 错误处理器
   */
  errorHandler?: IErrorHandler;
}

/**
 * 核心API客户端
 * 平台无关的API请求实现
 */
export class ApiClient {
  /**
   * Axios实例
   */
  protected axiosInstance: AxiosInstance;

  /**
   * 平台适配器
   */
  protected platformAdapter: PlatformAdapter;

  /**
   * 配置选项
   */
  protected config: ApiClientConfig;

  /**
   * HTTP状态码到错误代码的映射
   */
  protected httpStatusToErrorCode: Record<number, ErrorCode> = {
    400: ErrorCode.BAD_REQUEST,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    405: ErrorCode.METHOD_NOT_ALLOWED,
    408: ErrorCode.REQUEST_TIMEOUT,
    409: ErrorCode.CONFLICT,
    413: ErrorCode.PAYLOAD_TOO_LARGE,
    429: ErrorCode.TOO_MANY_REQUESTS,
    500: ErrorCode.INTERNAL_ERROR,
    503: ErrorCode.SERVICE_UNAVAILABLE,
  };

  /**
   * 错误处理器
   */
  protected errorHandler: IErrorHandler;

  /**
   * 创建API客户端
   * @param config 客户端配置
   */
  constructor(config: ApiClientConfig) {
    this.config = {
      tokenKey: 'auth_token',
      refreshTokenKey: 'refresh_token',
      loginPath: '/login',
      ...config,
    };

    this.platformAdapter = config.platformAdapter;

    // 初始化错误处理器（如果没有提供，使用默认的）
    this.errorHandler = config.errorHandler || new BaseErrorHandler();

    // 创建axios实例时剔除自定义配置属性
    const { ...axiosConfig } = config;

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...config.headers,
      },
      ...axiosConfig,
    });

    this.setupInterceptors();
  }

  /**
   * 配置请求和响应拦截器
   */
  protected setupInterceptors(): void {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      async config => {
        // 如果已有认证头，直接使用
        if (config.headers.Authorization) {
          return config;
        }

        try {
          // 获取认证令牌
          const token = await this.platformAdapter.getStorage().getItem(this.config.tokenKey!);
          console.log('token', token);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('获取认证令牌失败:', error);
        }

        return config;
      },
      error => Promise.reject(error)
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => {
        // 检查API响应状态码
        if (response.data.code !== ApiStatusCode.SUCCESS) {
          // 创建自定义错误
          const error = new Error(response.data.message || '请求失败') as ApiError;
          error.code = response.data.code;
          error.data = response.data.data;
          error.response = response;
          return Promise.reject(error);
        }

        return response;
      },
      async (error: AxiosError<ApiResponse<unknown>>) => {
        // 处理响应错误
        if (error.response) {
          const status = error.response.status;

          // 如果是401未授权，可能需要刷新Token或重定向到登录
          if (status === 401) {
            // 检查是否已经尝试过刷新Token，避免死循环
            const isRefreshTokenRequest = error.config?.url?.includes('/auth/refresh-token');

            if (!isRefreshTokenRequest) {
              try {
                // 尝试刷新Token
                const refreshed = await this.refreshToken();
                if (refreshed) {
                  // 重新发送原始请求
                  const originalRequest = error.config;
                  if (originalRequest) {
                    const token = await this.platformAdapter
                      .getStorage()
                      .getItem(this.config.tokenKey!);
                    if (token && originalRequest.headers) {
                      originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return this.axiosInstance(originalRequest);
                  }
                } else {
                  // 刷新失败但没有抛出异常，主动处理认证失败
                  await this.handleAuthFailure();
                }
              } catch {
                // 刷新Token失败，重定向到登录
                await this.handleAuthFailure();
              }
            } else {
              // 刷新Token请求本身失败，直接处理认证失败
              await this.handleAuthFailure();
            }
          }

          // 构造标准错误响应
          let errorResponse: ApiResponse<null> = {
            code: this.httpStatusToErrorCode[status] || ErrorCode.UNKNOWN_ERROR,
            message: error.response.statusText || '请求失败',
            data: null,
            timestamp: Date.now(),
            path: error.config?.url,
          };

          // 如果服务器返回了标准错误格式，使用它
          if (error.response.data && typeof error.response.data === 'object') {
            if ('code' in error.response.data && 'message' in error.response.data) {
              errorResponse = error.response.data as ApiResponse<null>;

              // 格式化错误数据中的errors数组
              if (errorResponse.data) {
                errorResponse = {
                  ...errorResponse,
                  data: this.formatErrorData(errorResponse.data),
                } as ApiResponse<null>;
              }
            }
          }

          // 处理错误
          this.handleApiError(errorResponse, error, error.config?.url, error.config?.method);

          return Promise.reject(errorResponse);
        } else if (error.request) {
          // 请求发出但未收到响应
          const errorResponse = {
            code: ErrorCode.TIMEOUT_ERROR,
            message: '网络请求超时或服务不可用',
            data: null,
            timestamp: Date.now(),
          } as ApiResponse<null>;

          // 处理错误
          this.handleApiError(errorResponse, error, error.config?.url, error.config?.method);

          return Promise.reject(errorResponse);
        } else {
          // 请求配置错误
          const errorResponse = {
            code: ErrorCode.UNKNOWN_ERROR,
            message: error.message || '未知错误',
            data: null,
            timestamp: Date.now(),
          } as ApiResponse<null>;

          // 处理错误
          this.handleApiError(errorResponse, error, error.config?.url, error.config?.method);

          return Promise.reject(errorResponse);
        }
      }
    );
  }

  /**
   * 刷新认证令牌
   * @returns 是否成功刷新
   */
  protected async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await this.platformAdapter
        .getStorage()
        .getItem(this.config.refreshTokenKey!);
      if (!refreshToken) {
        return false;
      }

      // 创建一个不会触发刷新令牌逻辑的axios实例
      const response = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
        `${this.config.baseURL}/auth/refresh-token`,
        { refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (response.status === 200 && response.data.code === ApiStatusCode.SUCCESS) {
        // 保存新token
        await this.platformAdapter
          .getStorage()
          .setItem(this.config.tokenKey!, response.data.data.token);
        await this.platformAdapter
          .getStorage()
          .setItem(this.config.refreshTokenKey!, response.data.data.refreshToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('刷新Token失败:', error);
      return false;
    }
  }

  /**
   * 处理认证失败
   */
  protected async handleAuthFailure(): Promise<void> {
    // 清除认证信息
    await this.platformAdapter.getStorage().removeItem(this.config.tokenKey!);
    await this.platformAdapter.getStorage().removeItem(this.config.refreshTokenKey!);

    // 重定向到登录页面
    this.platformAdapter.redirectToLogin(this.config.loginPath!);
  }

  /**
   * 设置认证令牌
   * @param token 认证令牌，传null表示移除令牌
   */
  public async setAuthToken(token: string | null): Promise<void> {
    try {
      if (token) {
        // 保存令牌到存储
        await this.platformAdapter.getStorage().setItem(this.config.tokenKey!, token);
        // 设置认证头
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        // 移除令牌
        await this.platformAdapter.getStorage().removeItem(this.config.tokenKey!);
        // 移除认证头
        delete this.axiosInstance.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('设置认证令牌失败:', error);
      throw error;
    }
  }

  /**
   * 设置刷新令牌
   * @param refreshToken 刷新令牌，传null表示移除令牌
   */
  public async setRefreshToken(refreshToken: string | null): Promise<void> {
    try {
      if (refreshToken) {
        // 保存令牌到存储
        await this.platformAdapter.getStorage().setItem(this.config.refreshTokenKey!, refreshToken);
      } else {
        // 移除令牌
        await this.platformAdapter.getStorage().removeItem(this.config.refreshTokenKey!);
      }
    } catch (error) {
      console.error('设置刷新令牌失败:', error);
      throw error;
    }
  }

  /**
   * 获取认证令牌
   * @returns 从存储中获取的令牌
   */
  public async getAuthToken(): Promise<string | null> {
    return await this.platformAdapter.getStorage().getItem(this.config.tokenKey!);
  }

  /**
   * 获取刷新令牌
   * @returns 从存储中获取的刷新令牌
   */
  public async getRefreshToken(): Promise<string | null> {
    return await this.platformAdapter.getStorage().getItem(this.config.refreshTokenKey!);
  }

  /**
   * 清除所有认证信息
   */
  public async clearAuth(): Promise<void> {
    await this.platformAdapter.getStorage().removeItem(this.config.tokenKey!);
    await this.platformAdapter.getStorage().removeItem(this.config.refreshTokenKey!);
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  /**
   * 通用请求方法
   * @param config 请求配置
   * @returns 响应数据
   */
  public async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance(config);
      // 返回data字段中的实际数据
      return response.data.data;
    } catch (error: unknown) {
      // 如果错误已经是标准ApiResponse格式，处理后抛出
      if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
        // 格式化错误数据中的errors数组
        if ('data' in error && error.data) {
          error.data = this.formatErrorData(error.data);
        }
        throw error;
      }

      // 其他错误转换为标准格式
      const apiError: ApiResponse<null> = {
        code: ErrorCode.UNKNOWN_ERROR,
        message: error instanceof Error ? error.message : '未知错误',
        data: null,
        timestamp: Date.now(),
      };
      throw apiError;
    }
  }

  /**
   * GET请求
   * @param url 请求路径
   * @param config 请求配置
   * @returns 响应数据
   */
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  /**
   * POST请求
   * @param url 请求路径
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async post<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  /**
   * PUT请求
   * @param url 请求路径
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  /**
   * PATCH请求
   * @param url 请求路径
   * @param data 请求数据
   * @param config 请求配置
   * @returns 响应数据
   */
  public async patch<T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  /**
   * DELETE请求
   * @param url 请求路径
   * @param config 请求配置
   * @returns 响应数据
   */
  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  /**
   * 获取分页数据
   * @param url 请求路径
   * @param params 查询参数
   * @param config 请求配置
   * @returns 分页数据
   */
  public async getPage<T>(
    url: string,
    params: { page?: number; limit?: number; [key: string]: unknown } = {},
    config?: AxiosRequestConfig
  ): Promise<PaginatedData<T>> {
    return this.request<PaginatedData<T>>({
      ...config,
      method: 'GET',
      url,
      params: {
        page: params.page || 1,
        limit: params.limit || 10,
        ...params,
      },
    });
  }

  /**
   * 设置错误处理器
   * @param errorHandler 错误处理器
   */
  public setErrorHandler(errorHandler: IErrorHandler): void {
    this.errorHandler = errorHandler;
  }

  /**
   * 获取错误处理器
   * @returns 错误处理器
   */
  public getErrorHandler(): IErrorHandler {
    return this.errorHandler;
  }

  /**
   * 处理API错误
   * @param apiResponse API响应
   * @param originalError 原始错误
   * @param url 请求URL
   * @param method 请求方法
   */
  /**
   * 格式化错误数据中的errors数组
   * @param data 错误数据
   * @returns 格式化后的错误数据
   */
  protected formatErrorData(data: unknown): unknown {
    // 如果data为空或不是对象，直接返回
    if (!data || typeof data !== 'object') {
      return data;
    }

    // 复制一份数据，避免修改原始数据
    const formattedData = { ...data };

    // 处理errors数组
    if ('errors' in formattedData && Array.isArray(formattedData.errors)) {
      // 将errors数组中的对象转换为字符串
      formattedData.errors = formattedData.errors.map((error: unknown) => {
        if (typeof error === 'object' && error !== null) {
          try {
            // 尝试将对象转换为JSON字符串
            return JSON.stringify(error);
          } catch {
            // 如果转换失败，返回原始对象
            return error;
          }
        }
        return error;
      });

      // 如果需要，可以将整个errors数组合并为一个字符串
      // formattedData.errorsText = formattedData.errors.join('; ');
    }

    return formattedData;
  }

  /**
   * 处理API错误
   * @param apiResponse API响应
   * @param originalError 原始错误
   * @param url 请求URL
   * @param method 请求方法
   */
  protected handleApiError(
    apiResponse: ApiResponse<unknown>,
    originalError: unknown,
    url?: string,
    method?: string
  ): void {
    // 格式化错误数据中的errors数组
    if (apiResponse && apiResponse.data) {
      apiResponse.data = this.formatErrorData(apiResponse.data);
    }

    // 如果有错误处理器，使用它处理错误
    if (this.errorHandler) {
      this.errorHandler.handleError({
        error: originalError,
        apiResponse,
        errorCode: apiResponse.code,
        message: apiResponse.message,
        url,
        method,
        timestamp: apiResponse.timestamp || Date.now(),
      });
    }
  }
}
