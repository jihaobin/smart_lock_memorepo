import { ApiResponse, ErrorCode } from '../../shared/types/common';

/**
 * 错误处理器上下文
 * 包含错误相关的信息
 */
export interface ErrorHandlerContext {
  /**
   * 原始错误对象
   */
  error: unknown;

  /**
   * API响应（如果有）
   */
  apiResponse?: ApiResponse<unknown>;

  /**
   * 错误代码
   */
  errorCode?: ErrorCode | number;

  /**
   * 错误消息
   */
  message?: string;

  /**
   * 请求URL
   */
  url?: string;

  /**
   * 请求方法
   */
  method?: string;

  /**
   * 错误时间戳
   */
  timestamp: number;
}

/**
 * 错误处理策略
 */
export enum ErrorHandlingStrategy {
  /**
   * 忽略错误，继续执行
   */
  IGNORE = 'ignore',

  /**
   * 重试请求
   */
  RETRY = 'retry',

  /**
   * 抛出错误，让上层处理
   */
  THROW = 'throw',

  /**
   * 自定义处理，由处理器决定
   */
  CUSTOM = 'custom'
}

/**
 * 错误处理结果
 */
export interface ErrorHandlingResult {
  /**
   * 处理策略
   */
  strategy: ErrorHandlingStrategy;

  /**
   * 是否已处理
   */
  handled: boolean;

  /**
   * 重试次数（仅当策略为RETRY时有效）
   */
  retryCount?: number;

  /**
   * 自定义数据
   */
  data?: unknown;
}

/**
 * 错误处理器接口
 * 定义了API错误处理的通用接口
 */
export interface IErrorHandler {
  /**
   * 处理API错误
   * @param context 错误上下文
   * @returns 处理结果
   */
  handleError(context: ErrorHandlerContext): Promise<ErrorHandlingResult> | ErrorHandlingResult;

  /**
   * 设置错误处理策略
   * @param errorCode 错误代码
   * @param strategy 处理策略
   */
  setStrategyForError(errorCode: ErrorCode | number, strategy: ErrorHandlingStrategy): void;

  /**
   * 注册全局错误监听器
   * @param listener 错误监听函数
   * @returns 用于取消监听的函数
   */
  registerErrorListener(
    listener: (context: ErrorHandlerContext) => void
  ): () => void;
}