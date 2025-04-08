/**
 * 服务端特定入口文件
 * 导出数据库和其他Node.js特定功能
 */

// 导出共享模块
export * from '../shared';

// 导出数据库相关功能
export { connect, db, setLogWriter } from '../db';
export * as schema from '../db/schema';

// 安全地检测运行环境
let isNodeEnv = false;

try {
  isNodeEnv = typeof process !== 'undefined' &&
              !!process.versions &&
              !!process.versions.node;
} catch{
  // 不是Node环境，忽略错误
  console.warn('Not running in Node.js environment');
}

// 安全地加载dotenv（仅在Node.js环境中）
if (isNodeEnv) {
  (async () => {
    try {
      // 动态导入dotenv，避免在非Node.js环境中报错
      const dotenvModule = await import('dotenv');
      dotenvModule.config({ path: '../../.env' });
    } catch {
      console.warn('加载环境变量失败，这在开发环境中是可以接受的');
    }
  })().catch(() => {
    /* 忽略顶层Promise错误 */
  });
}