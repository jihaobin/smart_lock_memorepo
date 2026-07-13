/**
 * 认证状态管理器
 */
export class AuthManager {
  // 标记用户是否已登录
  private isLoggedIn: boolean | null = null;

  // 认证状态的过期时间（毫秒）
  private stateExpiresAt: number = 0;

  // 认证状态的有效期（默认15分钟）
  private readonly STATE_VALIDITY_MS: number = 15 * 60 * 1000;

  // 验证Promise缓存
  private validationPromise: Promise<boolean> | null = null;

  // 挂起的请求队列
  private pendingRequests: Array<{
    resolve: (value: boolean) => void;
    reject: (reason) => void;
  }> = [];

  // 需要认证的API路径正则表达式
  private protectedPaths: RegExp[] = [
    /^\/(?!auth\/(?:login|register|forgot-password|send_verification_code)$|public\/)/,
  ];

  // 令牌检查回调函数
  private tokenChecker: (() => Promise<boolean>) | null = null;

  /**
   * 设置令牌检查函数
   * @param checker 检查token是否存在的函数
   */
  public setTokenChecker(checker: () => Promise<boolean>): void {
    this.tokenChecker = checker;
  }

  /**
   * 设置登录状态
   * @param status 登录状态
   */
  public setLoggedIn(status: boolean): void {
    this.isLoggedIn = status;

    // 设置状态过期时间
    if (status) {
      this.stateExpiresAt = Date.now() + this.STATE_VALIDITY_MS;
    } else {
      // 登出时立即过期状态
      this.stateExpiresAt = 0;
      this.validationPromise = null;
      // 拒绝所有挂起的请求
      this.rejectAllPendingRequests('用户已登出');
    }
  }

  /**
   * 检查路径是否需要认证
   */
  public isProtectedPath(path: string): boolean {
    return this.protectedPaths.some(pattern => pattern.test(path));
  }

  /**
   * 拒绝所有挂起的请求
   */
  private rejectAllPendingRequests(reason: string): void {
    const error = { message: reason, code: 401 };
    while (this.pendingRequests.length > 0) {
      const request = this.pendingRequests.shift();
      if (request) {
        request.reject(error);
      }
    }
  }

  /**
   * 解析所有挂起的请求
   */
  private resolveAllPendingRequests(value: boolean): void {
    while (this.pendingRequests.length > 0) {
      const request = this.pendingRequests.shift();
      if (request) {
        request.resolve(value);
      }
    }
  }

  /**
   * 判断请求是否应该被允许发送
   * 关键优化：使用缓存和聚合验证
   */
  public shouldAllowRequest(path: string): Promise<boolean> {
    // 如果是非保护路径，总是允许
    if (!this.isProtectedPath(path)) {
      return Promise.resolve(true);
    }

    // 检查登录状态是否有效且未过期
    const now = Date.now();
    if (this.isLoggedIn === true && now < this.stateExpiresAt) {
      return Promise.resolve(true);
    }

    // 如果明确知道未登录，直接拒绝
    if (this.isLoggedIn === false) {
      return Promise.resolve(false);
    }

    // 如果已有验证进行中，加入等待队列
    if (this.validationPromise) {
      return new Promise((resolve, reject) => {
        this.pendingRequests.push({ resolve, reject });
      });
    }

    // 创建新的验证Promise
    this.validationPromise = this.validateAuthStatus();

    // 返回验证Promise
    return this.validationPromise;
  }

  /**
   * 验证认证状态
   * 注意：这个方法不实际发送请求，而是基于token存在性判断
   * 实际的验证会在首次API请求发送时由服务器完成
   */
  private async validateAuthStatus(): Promise<boolean> {
    try {
      // 检查是否设置了token检查器
      if (!this.tokenChecker) {
        console.warn('AuthManager: Token checker not set');
        return false;
      }

      // 检查token是否存在
      const hasToken = await this.tokenChecker();

      // 更新状态
      this.isLoggedIn = hasToken;
      if (hasToken) {
        this.stateExpiresAt = Date.now() + this.STATE_VALIDITY_MS;
      } else {
        this.stateExpiresAt = 0;
      }

      // 解析所有等待的请求
      this.resolveAllPendingRequests(hasToken);
      return hasToken;
    } catch (error) {
      // 出错时保守处理
      console.error('AuthManager: Error validating token', error);
      this.isLoggedIn = null;
      this.stateExpiresAt = 0;

      // 拒绝所有等待的请求
      this.rejectAllPendingRequests('验证失败');
      return false;
    } finally {
      // 清除验证Promise
      this.validationPromise = null;
    }
  }

  /**
   * 处理401错误
   * 当收到401错误时调用，标记认证状态为失效
   */
  public handleAuthError(): void {
    this.isLoggedIn = false;
    this.stateExpiresAt = 0;
    this.validationPromise = null;
  }

  /**
   * 重置认证状态
   * 在需要重新验证token时调用
   */
  public resetState(): void {
    this.isLoggedIn = null;
    this.stateExpiresAt = 0;
    this.validationPromise = null;
  }
}

// 导出单例
export const authManager = new AuthManager();
