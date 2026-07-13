import type { ServerEnv } from '@smart-lock/env/server';

import { createPoolConfig } from './db-config';

describe('createPoolConfig', () => {
  it('从 ServerEnv 创建连接选项', () => {
    expect(
      createPoolConfig({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db' } as ServerEnv)
    ).toMatchObject({ connectionString: 'postgresql://u:p@localhost:5432/db' });
  });
});
