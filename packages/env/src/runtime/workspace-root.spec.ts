import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { findWorkspaceRoot } from './workspace-root';

describe('findWorkspaceRoot', () => {
  it('从嵌套目录向上找到 pnpm-workspace.yaml', () => {
    const root = mkdtempSync(join(tmpdir(), 'smart-lock-env-'));
    const nested = join(root, 'apps', 'api');
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n");

    try {
      expect(findWorkspaceRoot(nested)).toBe(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
