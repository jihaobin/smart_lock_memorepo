import type { ServerEnv } from '@smart-lock/env/server';
import type { PoolConfig } from 'pg';

export function createPoolConfig(config: Pick<ServerEnv, 'DATABASE_URL'>): PoolConfig {
  return {
    connectionString: config.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}
