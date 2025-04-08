import { ErrorCode } from '../../shared/types/common';
import { BaseErrorHandler } from '../core/base-error-handler';
import { ErrorHandlerContext } from '../types/error-handler';

/**
 * 提示器接口
 * 抽象不同UI库的提示组件实现
 */
export interface IToaster {
  /**
   * 显示错误提示
   * @param message 错误消息
   * @param options 提示选项
   */
  showError(message: string, options?: unknown): void;

  /**
   * 显示警告提示
   * @param message 警告消息
   * @param options 提示选项
   */
  showWarning(message: string, options?: unknown): void;

  /**
   * 显示信息提示
   * @param message 信息消息
   * @param options 提示选项
   */
  showInfo(message: string, options?: unknown): void;

  /**
   * 显示成功提示
   * @param message 成功消息
   * @param options 提示选项
   */
  showSuccess(message: string, options?: unknown): void;
}

/**
 * React Native默认提示器配置
 */
export interface ReactNativeErrorHandlerConfig {
  /**
   * 提示器实现
   */
  toaster?: IToaster;

  /**
   * 是否在控制台打印错误
   */
  logErrors?: boolean;

  /**
   * 自定义错误消息映射
   */
  errorMessages?: Record<number, string>;

  /**
   * 是否显示错误代码
   */
  showErrorCodes?: boolean;
}

/**
 * React Native错误处理器
 * 适用于React Native环境的错误处理
 */
export class ReactNativeErrorHandler extends BaseErrorHandler {
  /**
   * 提示器实例
   */
  private toaster?: IToaster;

  /**
   * 配置
   */
  private config: ReactNativeErrorHandlerConfig;

  /**
   * 自定义错误消息映射
   */
  private errorMessages: Record<number, string> = {
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查您的网络设置',
    [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
    [ErrorCode.UNAUTHORIZED]: '登录已失效，请重新登录',
    [ErrorCode.FORBIDDEN]: '您没有权限执行此操作',
    [ErrorCode.NOT_FOUND]: '请求的资源不存在',
    [ErrorCode.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
    [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后重试',
  };

  constructor(config: ReactNativeErrorHandlerConfig = {}) {
    super();

    // 检查是否为开发环境
    const isDev = process.env.NODE_ENV === 'development';

    this.config = {
      logErrors: true,
      showErrorCodes: isDev, // 开发环境下显示错误代码
      ...config
    };

    this.toaster = config.toaster;

    // 合并自定义错误消息
    if (config.errorMessages) {
      this.errorMessages = {
        ...this.errorMessages,
        ...config.errorMessages
      };
    }

    // 注册全局错误处理
    this.registerErrorListener(this.handleGlobalError.bind(this));
  }

  /**
   * 设置提示器
   * @param toaster 提示器实例
   */
  public setToaster(toaster: IToaster): void {
    this.toaster = toaster;
  }

  /**
   * 处理全局错误
   * @param context 错误上下文
   */
  private handleGlobalError(context: ErrorHandlerContext): void {
    // 如果配置了在控制台打印错误
    if (this.config.logErrors) {
      console.error(
        `API Error (${context.errorCode}): ${context.message}`,
        context.url ? `URL: ${context.url}` : '',
        context.error
      );
    }

    // 如果有提示器，显示错误提示
    if (this.toaster) {
      const errorCode = context.errorCode || 0;
      // 获取错误消息，优先使用自定义消息
      let message = this.errorMessages[errorCode] || context.message || '未知错误';

      // 如果需要显示错误代码
      if (this.config.showErrorCodes && errorCode) {
        message = `[${errorCode}] ${message}`;
      }

      this.toaster.showError(message);
    }
  }
}