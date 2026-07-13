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
  /** 是否为开发环境 */
  isDevelopment: boolean;
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

  /**
   * UI错误提示过期时间（毫秒）
   */
  uiErrorExpirationTime?: number;
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

  /**
   * 最近显示的UI错误提示（用于UI提示去重）
   */
  private recentUIErrors: Set<string> = new Set();

  /**
   * UI错误提示过期时间（毫秒）
   */
  private uiErrorExpirationTime: number = 3000;

  constructor(config: ReactNativeErrorHandlerConfig) {
    super();

    this.config = {
      logErrors: true,
      showErrorCodes: config.isDevelopment,
      uiErrorExpirationTime: 3000, // 默认3秒UI错误提示过期时间
      ...config,
    };

    // 设置UI错误提示过期时间
    this.uiErrorExpirationTime = this.config.uiErrorExpirationTime || 3000;

    this.toaster = config.toaster;

    // 合并自定义错误消息
    if (config.errorMessages) {
      this.errorMessages = {
        ...this.errorMessages,
        ...config.errorMessages,
      };
    }

    // 注册全局错误处理
    this.registerErrorListener(this.handleGlobalError.bind(this));

    // 设置定期清理UI错误的任务
    setInterval(() => {
      this.clearExpiredUIErrors();
    }, this.uiErrorExpirationTime);
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

      // 检查是否已经显示过相同的UI错误提示
      const errorKey = this.getUIErrorKey(errorCode, message);
      if (!this.recentUIErrors.has(errorKey)) {
        this.recentUIErrors.add(errorKey);

        // 设置过期时间
        setTimeout(() => {
          this.recentUIErrors.delete(errorKey);
        }, this.uiErrorExpirationTime);

        // 显示错误提示
        this.toaster.showError(message);
      }
    }
  }

  /**
   * 获取UI错误的唯一键
   * @param errorCode 错误代码
   * @param message 错误消息
   * @returns UI错误键
   */
  private getUIErrorKey(errorCode: number, message: string): string {
    return `${errorCode}:${message}`;
  }

  /**
   * 清理过期的UI错误记录
   */
  private clearExpiredUIErrors(): void {
    // 这个方法用于彻底清理所有UI错误记录，防止内存泄漏
    this.recentUIErrors.clear();
  }
}
