/**
 * 数据库错误接口
 *
 */

export interface DatabaseError extends Error {
  /*
   * PostgreSQL 错误码（如 '23505'）
   */
  code?: string;
  /**
   * MySQL 错误码（如 1062）
   */
  errno?: number;
  /* **
   * 违反的约束名称
   */
  constraint?: string;
  /**
   * 违反约束的列
   */
  column?: string;
}
