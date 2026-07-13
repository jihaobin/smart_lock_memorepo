import { loadServerEnv } from '@smart-lock/env/server';
import { DefaultLogger, LogWriter } from 'drizzle-orm/logger';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schemas from './schema';
import { createPoolConfig } from './db-config';

// 扩展日志接口
interface EnhancedLogWriter extends LogWriter {
  error: (message: string) => void;
}

// 默认日志处理器，允许外部注入
let logWriter: EnhancedLogWriter = {
  write: (message: string) => console.info(message),
  error: (message: string) => console.error(message),
};

// 可以由外部注入的日志处理器
export function setLogWriter(writer: EnhancedLogWriter): void {
  logWriter = writer;
}

const connection = new Pool(createPoolConfig(loadServerEnv()));

const db = drizzle(connection, {
  logger: new DefaultLogger({ writer: logWriter }),
  schema: schemas,
  casing: 'snake_case',
});

const connect = async () => {
  if (!connection) {
    throw new Error('数据库连接未初始化，这可能是因为当前不是服务器环境');
  }

  try {
    const client = await connection.connect();
    logWriter.write('数据库连接成功');
    client.release();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWriter.error(`数据库连接失败: ${errorMessage}`);
    throw error;
  }
};

export { connect };
export default db;
