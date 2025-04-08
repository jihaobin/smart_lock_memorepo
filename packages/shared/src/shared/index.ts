/**
 * 共享模块入口文件
 * 导出共享类型和工具函数
 */

// 导出类型定义
export * from './types';

// 导出工具函数
export * from './utils';

// 导出常量和枚举
export * from './common';

export * from './constant';

// 平台检测工具（直接导出以便于使用）
export {
  isNode,
  isReactNative,
  isBrowser,
  Platform,
  getPlatform
} from './utils/platform';