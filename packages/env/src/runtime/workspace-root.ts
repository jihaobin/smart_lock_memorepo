import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

export function findWorkspaceRoot(startDirectory: string): string {
  const start = resolve(startDirectory);
  let current = start;

  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error(`Unable to locate pnpm workspace from ${start}`);
}
