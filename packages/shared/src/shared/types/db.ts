import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';

import * as adminSchema from '../../db/schema/admin_schema';
import * as dbSchema from '../../db/schema/schema';

export type DbType = NodePgDatabase<typeof dbSchema & typeof adminSchema>;

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
