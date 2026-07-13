import { loadServerEnv } from '@smart-lock/env/server';
import { defineConfig } from 'drizzle-kit';

const config = loadServerEnv();

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.DATABASE_URL,
  },
  verbose: true,
});
