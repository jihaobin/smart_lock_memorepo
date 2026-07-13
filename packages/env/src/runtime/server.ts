import { join } from 'node:path';

import dotenv from 'dotenv';

import { serverEnvSchema, type ServerEnv } from '../definitions/server';
import { resolveDeprecatedAliases } from './aliases';
import { findWorkspaceRoot } from './workspace-root';

export interface LoadServerEnvOptions {
  startDirectory?: string;
  source?: NodeJS.ProcessEnv;
  loadDotEnv?: boolean;
  onWarning?: (message: string) => void;
}

export function parseServerEnvWithoutSecretValues(source: NodeJS.ProcessEnv): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (result.success) return result.data;

  const issues = result.error.issues.map(issue => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'environment';
    return `[invalid] ${path}: ${issue.message}`;
  });
  throw new Error(`Environment configuration is invalid:\n${issues.join('\n')}`);
}

export function loadServerEnv(options: LoadServerEnvOptions = {}): ServerEnv {
  if (options.loadDotEnv !== false) {
    const root = findWorkspaceRoot(options.startDirectory ?? process.cwd());
    dotenv.config({ path: join(root, '.env') });
  }

  const source = resolveDeprecatedAliases(
    options.source ?? process.env,
    { PORT: ['API_PORT'] },
    options.onWarning ?? console.warn
  );
  return parseServerEnvWithoutSecretValues(source);
}
