import { ErrorCode } from '../../shared/types/common';
import { ReactNativeAdapter } from '../adapters/react-native-adapter';
import { ReactNativeErrorHandler, IToaster } from '../adapters/react-native-error-handler';
import { ApiClient } from '../core/api-client';
import { ErrorHandlingStrategy } from '../types/error-handler';
import { IAsyncStorage, INavigation } from '../types/react-native';

/**
 * Toast接口
 * 定义了通用的Toast库接口
 */
export interface IToastService {
  show(options: {
    type: 'success' | 'error' | 'info' | 'warning';
    text: string;
    duration?: number;
    [key: string]: unknown;
  }): void;
}

/**
 * 使用 Expo Toast 创建的提示器示例
 * 这里假设使用了一个名为 'expo-toast' 的假想库
 */
export class ExpoToaster implements IToaster {
  // Toast服务实例
  private toast: IToastService;

  constructor(toast: IToastService) {
    this.toast = toast;
  }

  showError(message: string, options?: Record<string, unknown>): void {
    this.toast.show({
      type: 'error',
      text: message,
      duration: 3000,
      ...(options as object || {})
    });
  }

  showWarning(message: string, options?: Record<string, unknown>): void {
    this.toast.show({
      type: 'warning',
      text: message,
      duration: 3000,
      ...(options as object || {})
    });
  }

  showInfo(message: string, options?: Record<string, unknown>): void {
    this.toast.show({
      type: 'info',
      text: message,
      duration: 2000,
      ...(options as object || {})
    });
  }

  showSuccess(message: string, options?: Record<string, unknown>): void {
    this.toast.show({
      type: 'success',
      text: message,
      duration: 2000,
      ...(options as object || {})
    });
  }
}

/**
 * 创建 API 客户端的工厂函数
 * @param asyncStorage AsyncStorage 实例
 * @param navigation 导航实例
 * @param toast Toast 实例
 * @returns API 客户端实例
 */
export function createApiClient(
  asyncStorage: IAsyncStorage,
  navigation: INavigation,
  toast: IToastService
) {
  // 创建平台适配器
  const adapter = new ReactNativeAdapter(asyncStorage, navigation);

  // 创建 Toast 提示器
  const toaster = new ExpoToaster(toast);

  // 检查是否为开发环境
  const isDev = process.env.NODE_ENV === 'development';

  // 创建错误处理器
  const errorHandler = new ReactNativeErrorHandler({
    toaster,
    logErrors: true,
    showErrorCodes: isDev, // 在开发环境中显示错误代码
    errorMessages: {
      // 自定义错误消息
      [ErrorCode.UNAUTHORIZED]: '您的登录已过期，请重新登录',
      [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查您的网络连接',
      // 添加更多自定义错误消息...
    }
  });

  // 为特定错误设置处理策略
  errorHandler.setStrategyForError(ErrorCode.UNAUTHORIZED, ErrorHandlingStrategy.THROW);
  errorHandler.setStrategyForError(ErrorCode.FORBIDDEN, ErrorHandlingStrategy.THROW);
  errorHandler.setStrategyForError(ErrorCode.NETWORK_ERROR, ErrorHandlingStrategy.RETRY);

  // 创建 API 客户端
  return new ApiClient({
    baseURL: 'https://api.example.com',
    platformAdapter: adapter,
    errorHandler,
    timeout: 15000
  });
}

/**
 * 使用示例
 */
export async function exampleUsage() {
  try {
    // 假设这些是在 React Native 组件中获取的实例
    const asyncStorage = null; // 应该是 AsyncStorage 实例
    const navigation = null; // 应该是导航实例
    const toast = null; // 应该是 Toast 实例

    // 创建 API 客户端
    const apiClient = createApiClient(asyncStorage, navigation, toast);

    // 调用 API
    const response = await apiClient.get('/users/me');
    console.log('User data:', response);

    // 返回结果
    return response;
  } catch (error) {
    console.error('Error in API call:', error);
    // 注意：错误已经通过错误处理器处理，这里可以添加额外的处理逻辑
    throw error;
  }
}