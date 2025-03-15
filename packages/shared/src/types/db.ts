import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';

import * as dbSchema from '../db/schema';

export type DbType = NodePgDatabase<typeof dbSchema>;

// 数据库配置类型
export interface DbConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

// 数据库连接选项
export interface DbConnectionOptions {
  maxConnections?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}
