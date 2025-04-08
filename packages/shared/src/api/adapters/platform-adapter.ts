/**
 * 平台适配器接口
 * 封装平台特定的API和功能
 */
export interface PlatformAdapter {
  /**
   * 平台名称
   */
  platform: 'browser' | 'react-native' | 'node';

  /**
   * 获取存储适配器
   */
  getStorage(): StorageAdapter;

  /**
   * 平台特定的网络请求配置
   */
  getNetworkConfig(): Record<string, unknown>;

  /**
   * 重定向到登录页面
   * @param loginPath 登录页面路径
   */
  redirectToLogin(loginPath: string): void;

  /**
   * 获取环境变量
   * @param name 环境变量名
   * @param defaultValue 默认值
   */
  getEnv(name: string, defaultValue?: string): string | undefined;
}

import { StorageAdapter } from '../storage/storage-interface';