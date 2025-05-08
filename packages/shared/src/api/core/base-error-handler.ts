import { ErrorCode } from '../../shared/types/common';
import {
  ErrorHandlerContext,
  ErrorHandlingResult,
  ErrorHandlingStrategy,
  IErrorHandler,
} from '../types/error-handler';
import { ErrorState } from '../utils/error-state';

/**
 * 基础错误处理器
 * 提供通用错误处理逻辑，可扩展实现平台特定的处理
 */
export class BaseErrorHandler implements IErrorHandler {
  /**
   * 错误代码对应的处理策略
   */
  protected errorStrategies: Map<number, ErrorHandlingStrategy> = new Map();

  /**
   * 全局错误监听器
   */
  protected listeners: Array<(context: ErrorHandlerContext) => void> = [];

  /**
   * 默认处理策略
   */
  protected defaultStrategy: ErrorHandlingStrategy = ErrorHandlingStrategy.THROW;

  /**
   * 错误状态管理器
   */
  protected errorState: ErrorState = ErrorState.getInstance();

  /**
   * 错误消息过期时间（毫秒）
   */
  protected errorExpirationTime: number = 5000;

  constructor() {
    // 设置一些常见错误的默认处理策略
    this.errorStrategies.set(ErrorCode.UNAUTHORIZED, ErrorHandlingStrategy.THROW);
    this.errorStrategies.set(ErrorCode.FORBIDDEN, ErrorHandlingStrategy.THROW);
    this.errorStrategies.set(ErrorCode.NOT_FOUND, ErrorHandlingStrategy.THROW);
    this.errorStrategies.set(ErrorCode.TIMEOUT_ERROR, ErrorHandlingStrategy.RETRY);
    this.errorStrategies.set(ErrorCode.NETWORK_ERROR, ErrorHandlingStrategy.RETRY);

    // 设置定期清理过期错误的任务
    setInterval(() => {
      this.errorState.cleanExpiredErrors(this.errorExpirationTime);
    }, this.errorExpirationTime);
  }

  /**
   * 处理API错误（增强版，支持节流和去重）
   * @param context 错误上下文
   * @returns 处理结果
   */
  public handleError(context: ErrorHandlerContext): ErrorHandlingResult {
    // 生成错误的唯一键，使用错误代码和消息组合
    const errorKey = this.getErrorKey(context);

    // 检查是否需要忽略（节流和去重）
    if (!this.shouldProcessError(errorKey, context)) {
      return {
        strategy: ErrorHandlingStrategy.IGNORE,
        handled: true,
        throttled: true,
      };
    }

    // 通知所有错误监听器
    this.notifyListeners(context);

    // 获取错误处理策略
    const errorCode = context.errorCode || 0;
    const strategy = this.getStrategyForError(errorCode);

    // 根据策略处理错误
    switch (strategy) {
      case ErrorHandlingStrategy.IGNORE:
        return {
          strategy,
          handled: true,
        };

      case ErrorHandlingStrategy.RETRY:
        return {
          strategy,
          handled: false,
          retryCount: 1,
        };

      case ErrorHandlingStrategy.THROW:
      case ErrorHandlingStrategy.CUSTOM:
      default:
        return {
          strategy,
          handled: false,
        };
    }
  }

  /**
   * 设置错误处理策略
   * @param errorCode 错误代码
   * @param strategy 处理策略
   */
  public setStrategyForError(errorCode: ErrorCode | number, strategy: ErrorHandlingStrategy): void {
    this.errorStrategies.set(errorCode, strategy);
  }

  /**
   * 获取错误处理策略
   * @param errorCode 错误代码
   * @returns 处理策略
   */
  protected getStrategyForError(errorCode: number): ErrorHandlingStrategy {
    return this.errorStrategies.get(errorCode) || this.defaultStrategy;
  }

  /**
   * 设置默认错误处理策略
   * @param strategy 处理策略
   */
  public setDefaultStrategy(strategy: ErrorHandlingStrategy): void {
    this.defaultStrategy = strategy;
  }

  /**
   * 注册全局错误监听器
   * @param listener 错误监听函数
   * @returns 用于取消监听的函数
   */
  public registerErrorListener(listener: (context: ErrorHandlerContext) => void): () => void {
    this.listeners.push(listener);

    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 通知所有监听器
   * @param context 错误上下文
   */
  protected notifyListeners(context: ErrorHandlerContext): void {
    for (const listener of this.listeners) {
      try {
        listener(context);
      } catch (error) {
        console.error('Error in error handler listener:', error);
      }
    }
  }

  /**
   * 获取错误的唯一键
   * @param context 错误上下文
   * @returns 错误键
   */
  protected getErrorKey(context: ErrorHandlerContext): string {
    return `${context.errorCode || 0}:${context.message || ''}`;
  }

  /**
   * 检查是否应该处理此错误（节流和去重逻辑）
   * @param errorKey 错误键
   * @param context 错误上下文
   * @returns 是否应该处理
   */
  protected shouldProcessError(errorKey: string, context: ErrorHandlerContext): boolean {
    return this.errorState.addError(errorKey, context.message || '');
  }
}
