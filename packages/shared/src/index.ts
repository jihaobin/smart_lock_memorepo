/**
 * 类型导出
 */
export * from './types';

/**
 * 工具函数导出
 */
export * from './utils';

/**
 * 数据库相关导出
 */
export { connect, db, setLogWriter } from './db';
export * as schema from './db/schema';

/**
 * API响应类型导出
 */
export { ErrorCode as ApiErrorCode } from './types/common';
export type { ApiStatusCode, ApiResponse, PaginationMeta, PaginatedData } from './types/common';

// 为了向后兼容，保留原有的命名空间导出
import * as TypeExports from './types';
import * as UtilsExports from './utils';

export const types = TypeExports;
export const utils = UtilsExports;
