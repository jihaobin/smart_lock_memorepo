import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { z } from 'zod';

import { updateEnvFile } from './env-file';
import { defineEnv } from '../../src/definitions/metadata';

const testDefinitions = {
  PORT: defineEnv({
    description: 'API 端口',
    group: 'server',
    schema: z.coerce.number(),
    required: true,
    secret: false,
    defaultValue: 3000,
  }),
  EXPO_PUBLIC_API_URL: defineEnv({
    description: '客户端 API URL',
    group: 'client-public',
    schema: z.string().url(),
    required: true,
    secret: false,
    defaultValue: 'http://localhost:3000/api',
  }),
};

describe('updateEnvFile', () => {
  let root: string;
  let envPath: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'smart-lock-env-file-'));
    envPath = join(root, '.env');
  });

  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('只追加缺失键并保留原内容逐字不变', () => {
    const original = '# local\nPORT=4100\nJWT_SECRET=virtual-secret-value-1234567890\n';
    writeFileSync(envPath, original);
    updateEnvFile(envPath, testDefinitions);
    const updated = readFileSync(envPath, 'utf8');
    expect(updated.startsWith(original)).toBe(true);
    expect(updated).toContain('EXPO_PUBLIC_API_URL=http://localhost:3000/api');
    expect(updated.match(/^PORT=/gm)).toHaveLength(1);
  });

  it('第二次执行不再改变文件', () => {
    updateEnvFile(envPath, testDefinitions);
    const once = readFileSync(envPath, 'utf8');
    updateEnvFile(envPath, testDefinitions);
    expect(readFileSync(envPath, 'utf8')).toBe(once);
  });

  it('派生值使用同次解析的依赖值并进行 URL 编码', () => {
    const definitions = {
      USER: defineEnv({
        description: '用户',
        group: 'database',
        schema: z.string(),
        required: true,
        secret: false,
        defaultValue: 'user name',
      }),
      URL: defineEnv({
        description: 'URL',
        group: 'database',
        schema: z.string(),
        required: true,
        secret: true,
        generateLocalValue: values => `scheme://${encodeURIComponent(values.USER)}`,
      }),
    };
    updateEnvFile(envPath, definitions);
    expect(readFileSync(envPath, 'utf8')).toContain('URL=scheme://user%20name');
  });
});
