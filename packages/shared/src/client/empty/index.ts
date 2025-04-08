/**
 * 空模块实现
 * 用于在客户端环境中替代Node.js特定模块
 */

// 提供空的pg实现
export const Pool = class {
  constructor() {
    throw new Error('数据库连接在客户端环境中不可用');
  }
};

// 提供空的process实现
export const process = {
  env: {},
  versions: {}
};

// 提供空的fs实现
export const fs = {
  readFileSync: () => { throw new Error('文件系统在客户端环境中不可用'); },
  writeFileSync: () => { throw new Error('文件系统在客户端环境中不可用'); },
  existsSync: () => false
};

// 提供空的path实现
export const path = {
  join: (...args: string[]) => args.join('/'),
  resolve: (...args: string[]) => args.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
  basename: (p: string) => p.split('/').pop() || ''
};

// 提供空的dotenv实现
export const config = () => {};

// 导出默认空对象
export default {};