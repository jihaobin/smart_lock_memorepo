import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parse } from 'dotenv';

import { clientDefinitions } from '../src/definitions/client';
import { serverDefinitions } from '../src/definitions/server';
import { loadServerEnv } from '../src/runtime/server';
import { findWorkspaceRoot } from '../src/runtime/workspace-root';
import { updateEnvFile } from './lib/env-file';

const definitions = { ...serverDefinitions, ...clientDefinitions };
const root = findWorkspaceRoot(process.cwd());
const envPath = join(root, '.env');

updateEnvFile(envPath, definitions);
const source = parse(readFileSync(envPath));
const missing = Object.entries(definitions)
  .filter(([key, definition]) => definition.required && !source[key])
  .map(([key]) => key);

if (missing.length > 0) {
  for (const key of missing) console.error(`[missing] ${key}: 必填配置尚未填写`);
  process.exitCode = 1;
} else {
  loadServerEnv({ source, loadDotEnv: false });
  console.info('Environment configuration is valid.');
}
