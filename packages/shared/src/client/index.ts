/**
 * 客户端特定入口文件
 * 导出API客户端和相关适配器
 */

// 导出共享模块
export * from '../shared';

// API客户端核心
export { ApiClient } from '../api/core/api-client';
export type { ApiClientConfig } from '../api/core/api-client.d';
export { ApiFactory } from '../api/factory/api-factory';
export { createQueryHooks } from '../api/hooks/use-query-factory';

// 平台适配器
export type { PlatformAdapter } from '../api/adapters/platform-adapter';
export type { StorageAdapter } from '../api/storage/storage-interface';
export { ReactNativeAdapter } from '../api/adapters/react-native-adapter';
export { BrowserAdapter } from '../api/adapters/browser-adapter';

// API相关类型
export type { IAsyncStorage, INavigation } from '../api/types/react-native';

// 为方便使用导出命名空间
import * as ApiExports from '../api';
export const api = ApiExports;