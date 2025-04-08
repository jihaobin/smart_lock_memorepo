import { IErrorHandler } from 'api/types/error-handler';

import { PlatformAdapter } from '../adapters/platform-adapter';
import { ApiClient } from '../core/api-client';

/**
 * API客户端工厂
 * 负责创建和配置API客户端实例
 */
export class ApiFactory {
  /**
   * 创建API客户端
   * @param adapter 平台适配器
   * @param baseURL API基础URL
   * @param options 额外配置选项
   */
  static createClient({
    adapter,
    baseURL,
    options,
    errorHandler,
  }: {
    adapter: PlatformAdapter;
    baseURL?: string;
    options: Record<string, unknown>;
    errorHandler: IErrorHandler;
  }): ApiClient {
    // 确定基础URL
    const apiUrl = baseURL || adapter.getEnv('API_URL', 'https://api.example.com');

    // 创建客户端实例
    const client = new ApiClient({
      baseURL: apiUrl,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      errorHandler: errorHandler as IErrorHandler,
      platformAdapter: adapter,
      ...options,
      ...adapter.getNetworkConfig(),
    });

    return client;
  }
}