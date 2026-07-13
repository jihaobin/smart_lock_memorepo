import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { clientDefinitions } from '../src/definitions/client';
import { serverDefinitions } from '../src/definitions/server';
import { findWorkspaceRoot } from '../src/runtime/workspace-root';
import { renderEnvExample, renderReadmeEnvTable, updateReadmeEnvTable } from './lib/generate';

const root = findWorkspaceRoot(process.cwd());
const definitions = { ...serverDefinitions, ...clientDefinitions };
const examplePath = join(root, '.env.example');
const readmePath = join(root, 'README.md');
const expectedExample = renderEnvExample(definitions);
const expectedReadme = updateReadmeEnvTable(
  readFileSync(readmePath, 'utf8'),
  renderReadmeEnvTable(definitions)
);

if (process.argv.includes('--check')) {
  const stale = [
    readFileSync(examplePath, 'utf8') === expectedExample ? null : '.env.example',
    readFileSync(readmePath, 'utf8') === expectedReadme ? null : 'README.md',
  ].filter(Boolean);
  if (stale.length > 0) {
    console.error(`[stale] ${stale.join(', ')}: 生成文件与环境契约不同步`);
    process.exitCode = 1;
  }
} else {
  writeFileSync(examplePath, expectedExample);
  writeFileSync(readmePath, expectedReadme);
}
