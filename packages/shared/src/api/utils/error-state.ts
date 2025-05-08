/**
 * 错误状态管理器
 * 用于维护全局错误状态，实现错误去重和节流
 */
export class ErrorState {
  private static instance: ErrorState;
  private errors: Map<string, { message: string; timestamp: number }> = new Map();
  private errorThrottleMap: Map<string, number> = new Map();
  private throttleTime = 300; // 节流时间，毫秒

  private constructor() {}

  /**
   * 获取错误状态单例
   * @returns ErrorState实例
   */
  public static getInstance(): ErrorState {
    if (!ErrorState.instance) {
      ErrorState.instance = new ErrorState();
    }
    return ErrorState.instance;
  }

  /**
   * 设置节流时间
   * @param time 节流时间（毫秒）
   */
  public setThrottleTime(time: number): void {
    this.throttleTime = time;
  }

  /**
   * 添加错误，返回是否为"新"错误（节流去重后）
   * @param key 错误键
   * @param message 错误消息
   * @returns 是否应该处理该错误
   */
  public addError(key: string, message: string): boolean {
    const now = Date.now();

    // 节流逻辑
    const lastTime = this.errorThrottleMap.get(key);
    if (lastTime && now - lastTime < this.throttleTime) {
      return false; // 节流期间，不处理
    }

    this.errorThrottleMap.set(key, now);
    this.errors.set(key, { message, timestamp: now });
    return true;
  }

  /**
   * 清理过期的错误
   * @param expirationTime 过期时间（毫秒）
   */
  public cleanExpiredErrors(expirationTime: number = 5000): void {
    const now = Date.now();
    for (const [key, error] of this.errors.entries()) {
      if (now - error.timestamp > expirationTime) {
        this.errors.delete(key);
      }
    }
  }

  /**
   * 检查错误是否已存在
   * @param key 错误键
   * @returns 是否存在
   */
  public hasError(key: string): boolean {
    return this.errors.has(key);
  }

  /**
   * 获取当前所有错误
   * @returns 错误映射
   */
  public getAllErrors(): Map<string, { message: string; timestamp: number }> {
    return new Map(this.errors);
  }

  /**
   * 清除所有错误
   */
  public clearAllErrors(): void {
    this.errors.clear();
    this.errorThrottleMap.clear();
  }
}
