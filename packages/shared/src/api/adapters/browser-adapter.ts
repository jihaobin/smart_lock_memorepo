import { PlatformAdapter } from './platform-adapter';
import { StorageAdapter } from '../storage/storage-interface';

/**
 * 浏览器存储适配器
 * 使用localStorage实现StorageAdapter接口
 */
class BrowserStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async clear(): Promise<void> {
    localStorage.clear();
  }
}

/**
 * 浏览器平台适配器
 */
export class BrowserAdapter implements PlatformAdapter {
  platform = 'browser' as const;
  private storage: StorageAdapter = new BrowserStorageAdapter();

  getStorage(): StorageAdapter {
    return this.storage;
  }

  getNetworkConfig() {
    return {
      withCredentials: true, // 浏览器中允许跨域请求携带cookies
    };
  }

  redirectToLogin(loginPath: string): void {
    // 浏览器环境下的重定向
    window.location.href = loginPath;
  }

/**
 * 获取环境变量
 * 按优先级依次尝试不同来源的环境变量
 * @param name 环境变量名称
 * @param defaultValue 默认值
 * @returns 环境变量值或默认值
 */
getEnv(name: string, defaultValue?: string): string | undefined {
  try {
    // 1. 检查Node.js环境变量 (SSR或混合环境)
    if (typeof process !== 'undefined' && process.env && process.env[name] !== undefined) {
      return process.env[name] || defaultValue;
    }

    // 2. 检查window对象上的环境变量容器 (常见的客户端注入模式)
    if (typeof window !== 'undefined') {
      // 2.1 检查通用环境变量对象
      const env = (window as unknown as { __ENV__?: Record<string, string> }).__ENV__ || (window as unknown as { ENV?: Record<string, string> }).ENV;
      if (env && env[name] !== undefined) {
        return env[name];
      }

      // 2.2 检查React应用常用的环境变量 REACT_APP_*
      const reactPrefix = 'REACT_APP_';
      if ((window as unknown as { [key: string]: string })[reactPrefix + name] !== undefined) {
        return (window as unknown as { [key: string]: string })[reactPrefix + name];
      }

      // 2.3 检查通过HTML meta标签注入的环境变量
      const metaTag = document.querySelector(`meta[name="env:${name}"]`);
      if (metaTag && metaTag.getAttribute('content')) {
        return metaTag.getAttribute('content') || defaultValue;
      }
    }

    // 3. 检查全局对象上的环境变量
    const globalEnv = (globalThis as unknown as { __ENV__?: Record<string, string> }).__ENV__;
    if (globalEnv && globalEnv[name] !== undefined) {
      return globalEnv[name];
    }
  } catch (error) {
    // 避免环境变量访问出错影响应用运行
    console.warn(`读取环境变量 ${name} 时出错:`, error);
  }

  // 如果以上所有方法都失败，返回默认值
  return defaultValue;
}
}