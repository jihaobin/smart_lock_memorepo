/**
 * 共享常量和枚举
 */

/**
 * 应用环境
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

/**
 * 使用者角色
 */
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest'
}

/**
 * 默认配置
 */
export const DEFAULT_CONFIG = {
  apiUrl: 'https://api.smart-lock.example.com',
  timeout: 30000, // 30秒
  retryCount: 3
};