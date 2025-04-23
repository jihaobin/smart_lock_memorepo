import * as process from 'node:process';

import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// 加载环境变量
dotenv.config({ path: '../../.env' });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
});
