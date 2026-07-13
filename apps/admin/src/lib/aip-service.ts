import { ErrorCode } from '@smart-lock/shared';
import {
  BrowserAdapter,
  IToaster,
  ApiFactory,
  createQueryHooks,
  BaseErrorHandler,
  ErrorHandlerContext,
} from '@smart-lock/shared/api';
import { toast } from 'sonner';

/**
 * Toast适配器实现
 * 使用sonner库作为通知提供者
 */
class ToastAdapter implements IToaster {
  showError(message: string): void {
    toast.error(message);
  }

  showWarning(message: string): void {
    toast.warning(message);
  }

  showInfo(message: string): void {
    toast.info(message);
  }

  showSuccess(message: string): void {
    toast.success(message);
  }
}

/**
 * 浏览器环境错误处理器
 */
class BrowserErrorHandler extends BaseErrorHandler {
  private toaster: IToaster;
  private isDev: boolean;
  private errorMessages: Record<number, string> = {
    [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查您的网络设置',
    [ErrorCode.TIMEOUT_ERROR]: '请求超时，请稍后重试',
    [ErrorCode.UNAUTHORIZED]: '登录已失效，请重新登录',
    [ErrorCode.FORBIDDEN]: '您没有权限执行此操作',
    [ErrorCode.NOT_FOUND]: '请求的资源不存在',
    [ErrorCode.INTERNAL_ERROR]: '服务器内部错误，请稍后重试',
    [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用，请稍后重试',
  };

  constructor(toaster: IToaster) {
    super();
    this.toaster = toaster;
    this.isDev = import.meta.env.DEV || false;

    // 注册全局错误处理
    this.registerErrorListener(this.handleGlobalError.bind(this));
  }

  private handleGlobalError(context: ErrorHandlerContext): void {
    // 开发环境下在控制台打印错误
    if (this.isDev) {
      console.error(
        `API Error (${context.errorCode}): ${context.message}`,
        context.url ? `URL: ${context.url}` : '',
        context.error
      );
    }

    // 显示错误提示
    const errorCode = context.errorCode || 0;
    // 获取错误消息，优先使用自定义消息
    let message = this.errorMessages[errorCode] || context.message || '未知错误';

    // 开发环境下显示错误代码
    if (this.isDev && errorCode) {
      message = `[${errorCode}] ${message}`;
    }

    this.toaster.showError(message);
  }
}

// 创建平台适配器
const adapter = new BrowserAdapter();

// 创建Toast适配器
const toastAdapter = new ToastAdapter();

// 创建错误处理器
const errorHandler = new BrowserErrorHandler(toastAdapter);

// 创建API客户端
const apiClient = ApiFactory.createClient({
  adapter,
  baseURL: 'http://localhost:3000/admin',
  options: {
    tokenKey: 'auth_token', // 认证令牌的存储键
    refreshTokenKey: 'refresh_token', // 刷新令牌的存储键
    loginPath: '/login', // 登录路由路径
  },
  errorHandler,
});

// 设置处理未授权错误的特殊处理，例如重定向到登录页面
errorHandler.registerErrorListener(context => {
  if (context.errorCode === ErrorCode.UNAUTHORIZED) {
    // 可以在此处添加登录过期的特殊处理逻辑
    // 例如重定向到登录页
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  }
});

// 创建查询hooks
const queryHooks = createQueryHooks(apiClient);

// 导出API客户端和相关功能
export { apiClient, queryHooks };

// 默认导出API客户端实例
export default apiClient;
