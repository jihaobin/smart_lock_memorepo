export * from './core/api-client';
export * from './factory/api-factory';
export * from './adapters/platform-adapter';
export * from './storage/storage-interface';
export * from './hooks/use-query-factory';

// 错误处理器导出
export * from './types/error-handler';
export * from './core/base-error-handler';
export * from './adapters/react-native-error-handler';

// 适配器导出
export * from './adapters/react-native-adapter';
export * from './adapters/browser-adapter';

// 类型导出
export * from './types/react-native';

// 完整命名空间导出
import * as AdaptersModule from './adapters/platform-adapter';
import * as CoreModule from './core/api-client';
import * as FactoryModule from './factory/api-factory';
import * as HooksModule from './hooks/use-query-factory';
import * as StorageModule from './storage/storage-interface';
import * as ErrorHandlerModule from './types/error-handler';

export const core = CoreModule;
export const factory = FactoryModule;
export const adapters = AdaptersModule;
export const storage = StorageModule;
export const hooks = HooksModule;
export const errorHandlers = ErrorHandlerModule;

// 不直接导出平台特定的适配器实现
// 应用层需要自己导入