/**
 * 平台检测工具
 * 用于在运行时检测当前执行环境
 */

/**
 * 检测是否为Node.js环境
 */
export const isNode = (): boolean => {
  try {
    return (
      typeof process !== 'undefined' &&
      process.versions !== undefined &&
      process.versions.node !== undefined
    );
  } catch {
    return false;
  }
};

/**
 * 检测是否为React Native环境
 */
export const isReactNative = (): boolean => {
  try {
    return (
      typeof navigator !== 'undefined' &&
      navigator.product === 'ReactNative'
    );
  } catch {
    return false;
  }
};

/**
 * 检测是否为浏览器环境
 */
export const isBrowser = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      !isReactNative()
    );
  } catch {
    return false;
  }
};

/**
 * 获取当前平台标识
 */
export enum Platform {
  Node = 'node',
  ReactNative = 'react-native',
  Browser = 'browser',
  Unknown = 'unknown'
}

/**
 * 获取当前平台
 */
export const getPlatform = (): Platform => {
  if (isNode()) return Platform.Node;
  if (isReactNative()) return Platform.ReactNative;
  if (isBrowser()) return Platform.Browser;
  return Platform.Unknown;
};