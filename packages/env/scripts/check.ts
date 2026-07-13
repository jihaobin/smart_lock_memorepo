import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { clientDefinitions } from '../src/definitions/client';
import { serverDefinitions } from '../src/definitions/server';
import { loadServerEnv } from '../src/runtime/server';
import { findWorkspaceRoot } from '../src/runtime/workspace-root';
import { checkComposeVariables } from './lib/contract-check';
import { renderEnvExample, renderReadmeEnvTable, updateReadmeEnvTable } from './lib/generate';

const root = findWorkspaceRoot(process.cwd());
const definitions = { ...serverDefinitions, ...clientDefinitions };

if (process.argv.includes('--contract')) {
  const errors = checkComposeVariables(
    readFileSync(join(root, 'docker-compose.yml'), 'utf8'),
    new Set(Object.keys(definitions))
  );
  if (readFileSync(join(root, '.env.example'), 'utf8') !== renderEnvExample(definitions)) {
    errors.push('[stale] .env.example: 生成文件与环境契约不同步');
  }
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  if (readme !== updateReadmeEnvTable(readme, renderReadmeEnvTable(definitions))) {
    errors.push('[stale] README.md: 环境变量表与契约不同步');
  }
  errors.forEach(error => console.error(error));
  if (errors.length > 0) process.exitCode = 1;
} else {
  loadServerEnv({ startDirectory: root });
}
