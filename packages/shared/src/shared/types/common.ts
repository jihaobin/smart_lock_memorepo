/**
 * API响应状态码枚举
 */
export enum ApiStatusCode {
  /**
   * 成功
   */
  SUCCESS = 0,

  /**
   * 失败
   */
  FAIL = 1,
}

/**
 * 统一API响应接口
 */
export interface ApiResponse<T = unknown> {
  /**
   * 状态码
   * 0表示成功，其他值表示错误
   */
  code: ApiStatusCode | ErrorCode | number;

  /**
   * 消息
   */
  message: string;

  /**
   * 数据
   * 成功时返回实际数据，失败时可能包含错误详情
   */
  data: T;

  /**
   * 时间戳
   */
  timestamp: number;

  /**
   * 请求路径
   * 主要用于错误响应
   */
  path?: string;

  /**
   * 错误堆栈
   * 仅在开发环境下的错误响应中返回
   */
  stack?: string;
}

/**
 * 分页元数据接口
 */
export interface PaginationMeta {
  /**
   * 当前页码
   */
  page: number;

  /**
   * 每页条数
   */
  limit: number;

  /**
   * 总条数
   */
  total: number;

  /**
   * 总页数
   */
  totalPages: number;

  /**
   * 是否有下一页
   */
  hasNext: boolean;

  /**
   * 是否有上一页
   */
  hasPrev: boolean;
}

/**
 * 分页数据接口
 */
export interface PaginatedData<T> {
  /**
   * 数据列表
   */
  items: T[];

  /**
   * 分页元数据
   */
  meta: PaginationMeta;
}

/**
 * 错误代码枚举
 * 用于区分不同类型的错误
 */
export enum ErrorCode {
  // 系统级错误 (1000-1999)
  INTERNAL_ERROR = 1000,
  UNKNOWN_ERROR = 1001,
  SERVICE_UNAVAILABLE = 1002,
  TIMEOUT_ERROR = 1003,
  NETWORK_ERROR = 1004,

  // HTTP错误 (2000-2999)
  BAD_REQUEST = 2000,
  UNAUTHORIZED = 2001,
  FORBIDDEN = 2002,
  NOT_FOUND = 2003,
  METHOD_NOT_ALLOWED = 2004,
  NOT_ACCEPTABLE = 2005,
  REQUEST_TIMEOUT = 2008,
  CONFLICT = 2009,
  GONE = 2010,
  PAYLOAD_TOO_LARGE = 2013,
  UNSUPPORTED_MEDIA_TYPE = 2015,
  TOO_MANY_REQUESTS = 2029,

  // 数据库错误 (3000-3999)
  DATABASE_ERROR = 3000,
  CONNECTION_ERROR = 3001,
  QUERY_ERROR = 3002,
  TRANSACTION_ERROR = 3003,
  CONSTRAINT_ERROR = 3004,
  FOREIGN_KEY_ERROR = 3005,
  UNIQUE_VIOLATION = 3006,
  NOT_NULL_VIOLATION = 3007,

  // 验证错误 (4000-4999)
  VALIDATION_ERROR = 4000,
  INVALID_PAYLOAD = 4001,
  INVALID_PARAM = 4002,
  INVALID_QUERY = 4003,
  INVALID_CREDENTIALS = 4004,

  // 业务逻辑错误 (5000-5999)
  BUSINESS_ERROR = 5000,
  RESOURCE_EXISTS = 5001,
  RESOURCE_NOT_FOUND = 5002,
  OPERATION_FAILED = 5003,
  OPERATION_NOT_ALLOWED = 5004,
  INSUFFICIENT_PERMISSIONS = 5005,

  // 外部服务错误 (6000-6999)
  EXTERNAL_SERVICE_ERROR = 6000,
  API_ERROR = 6001,
  INTEGRATION_ERROR = 6002,
}

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];
