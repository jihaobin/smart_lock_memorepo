/**
 * 服务端特定入口文件
 * 导出数据库和其他Node.js特定功能
 */

// 导出共享模块
export * from '../shared';

// 导出数据库相关功能
export { connect, db, setLogWriter } from '../db';
export * as schema from '../db/schema';
