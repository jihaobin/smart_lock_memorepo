# Centralized Environment Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 `@smart-lock/env` 单一配置契约，使根 `.env` 成为唯一真实值文件，并统一 API、数据库、Expo、示例文件、README 和 Docker Compose 的环境变量管理。

**Architecture:** 新建独立的 `packages/env` TypeScript 包，集中保存变量定义、Zod Schema、根目录定位、运行时解析和生成工具。服务端与客户端使用不同子路径导出，Expo 仅在一个受控文件中直接访问 `EXPO_PUBLIC_*`；`.env.example` 和 README 表格由契约生成，Compose 与源码引用由契约检查。

**Tech Stack:** TypeScript, Zod 3, dotenv, YAML, tsup, Jest/ts-jest, pnpm workspaces, NestJS, Expo, ESLint flat config

---

## 实施前保护规则

当前工作区存在与本计划重叠的未提交改动。开始实施前执行 `git status --short` 和 `git diff -- <task files>`，逐个理解重叠内容。不得 stash、覆盖、删除或提交用户已有改动；每个任务只能使用计划列出的精确路径执行 `git add -- <paths>`。

如果任务文件在实施前已经是 dirty 状态，必须先让用户提交该文件的原有改动，或明确授权将原有改动与本任务合并；在此之前可以分析但不能执行该任务的编辑和提交。当前已知重叠文件至少包括 `README.md`、根 `package.json`、`apps/api/package.json`、`packages/shared/.env` 和 `pnpm-lock.yaml`。

真实根 `.env` 只允许由用户确认后的 `env:init` 增量补全。测试必须使用临时目录和虚拟值，不能读取、打印或改写真实凭据。

## 文件结构

新增包的职责边界如下：

```text
packages/env/
├── package.json                 # 包导出、构建和测试命令
├── tsconfig.json                # Node/TypeScript 编译配置
├── tsup.config.ts               # client/server 分离构建
├── jest.config.cjs              # 包级 Jest 配置
├── src/
│   ├── definitions/
│   │   ├── metadata.ts          # EnvDefinition 类型和定义辅助函数
│   │   ├── server.ts            # 服务端、数据库、第三方变量
│   │   ├── client.ts            # Expo 公共变量
│   │   └── index.ts             # 定义集合导出
│   ├── runtime/
│   │   ├── aliases.ts           # 旧变量兼容和警告
│   │   ├── workspace-root.ts    # pnpm 工作区根定位
│   │   ├── server.ts            # 根 .env 加载和服务端解析
│   │   └── client.ts            # 客户端对象解析，不访问 Node API
│   └── index.ts                 # 仅导出平台无关类型
└── scripts/
    ├── lib/env-file.ts          # .env 安全创建与追加
    ├── lib/generate.ts          # example/README 生成
    ├── lib/contract-check.ts    # Compose 和契约检查
    ├── init.ts                  # env:init CLI
    ├── check.ts                 # env:check CLI
    └── generate.ts              # env:generate CLI
```

## Task 1: 建立 `@smart-lock/env` 包和定义元模型

**Files:**

- Create: `packages/env/package.json`
- Create: `packages/env/tsconfig.json`
- Create: `packages/env/tsup.config.ts`
- Create: `packages/env/jest.config.cjs`
- Create: `packages/env/src/definitions/metadata.ts`
- Create: `packages/env/src/definitions/metadata.spec.ts`
- Create: `packages/env/src/index.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 编写定义辅助函数的失败测试**

```ts
import { z } from 'zod';

import { defineEnv } from './metadata';

describe('defineEnv', () => {
  it('保留 Schema 和生成元数据', () => {
    const definition = defineEnv({
      description: 'API 端口',
      group: 'server',
      schema: z.coerce.number().int().min(1).max(65535),
      required: true,
      secret: false,
      defaultValue: 3000,
      deprecatedAliases: ['API_PORT'],
    });

    expect(definition.schema.parse('3000')).toBe(3000);
    expect(definition.deprecatedAliases).toEqual(['API_PORT']);
  });
});
```

- [ ] **Step 2: 运行测试并确认因模块不存在而失败**

Run: `pnpm --filter @smart-lock/env test -- metadata.spec.ts`

Expected: FAIL，提示找不到 `./metadata` 或 `@smart-lock/env` 包尚未建立。

- [ ] **Step 3: 创建包配置和最小定义类型**

`metadata.ts` 使用以下公共接口：

```ts
import { z } from 'zod';

export type EnvGroup = 'server' | 'client-public' | 'database' | 'third-party';

export interface EnvDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  description: string;
  group: EnvGroup;
  schema: TSchema;
  required: boolean;
  secret: boolean;
  defaultValue?: string | number | boolean;
  generateLocalValue?: (resolvedValues: Readonly<Record<string, string>>) => string;
  deprecatedAliases?: readonly string[];
}

export const defineEnv = <TSchema extends z.ZodTypeAny>(
  definition: EnvDefinition<TSchema>
): EnvDefinition<TSchema> => definition;
```

`package.json` 定义 `./client`、`./server`、`./definitions` 子路径，脚本使用 `tsup`、`jest --runInBand` 和 `tsx scripts/*.ts`。依赖声明为 `dotenv`、`yaml`、`zod`；开发依赖声明为 `@types/jest`、`@types/node`、`jest`、`ts-jest`、`tsup`、`tsx`、`typescript`。

- [ ] **Step 4: 安装依赖并运行测试与构建**

Run: `pnpm install`

Run: `pnpm --filter @smart-lock/env test -- metadata.spec.ts`

Expected: PASS，1 test passed。

Run: `pnpm --filter @smart-lock/env build`

Expected: PASS，并生成 `packages/env/dist` 的 client/server/definitions 入口。

- [ ] **Step 5: 精确提交包骨架**

```bash
git add -- packages/env pnpm-lock.yaml
git commit -m "feat(env): scaffold configuration contract package"
```

## Task 2: 定义完整变量契约、类型和别名解析

**Files:**

- Create: `packages/env/src/definitions/server.ts`
- Create: `packages/env/src/definitions/client.ts`
- Create: `packages/env/src/definitions/index.ts`
- Create: `packages/env/src/runtime/aliases.ts`
- Create: `packages/env/src/runtime/client.ts`
- Create: `packages/env/src/runtime/definitions.spec.ts`
- Modify: `packages/env/src/index.ts`
- Modify: `packages/env/tsup.config.ts`

- [ ] **Step 1: 编写服务端、客户端和别名失败测试**

```ts
import { parseClientEnv } from './client';
import { resolveDeprecatedAliases } from './aliases';
import { serverEnvSchema } from '../definitions/server';

describe('environment contract', () => {
  it('转换端口并应用默认值', () => {
    const parsed = serverEnvSchema.partial().parse({ PORT: '3100' });
    expect(parsed.PORT).toBe(3100);
  });

  it('只解析两个 Expo 公共 URL', () => {
    expect(
      parseClientEnv({
        EXPO_PUBLIC_API_URL: 'http://localhost:3000/api',
        EXPO_PUBLIC_SOCKET_URL: 'http://localhost:3000',
      })
    ).toEqual({
      apiUrl: 'http://localhost:3000/api',
      socketUrl: 'http://localhost:3000',
    });
  });

  it('新变量优先于旧别名', () => {
    const warnings: string[] = [];
    const result = resolveDeprecatedAliases(
      { PORT: '3001', API_PORT: '3000' },
      { PORT: ['API_PORT'] },
      warning => warnings.push(warning)
    );
    expect(result.PORT).toBe('3001');
    expect(warnings).toContain('[deprecated] API_PORT: 请迁移为 PORT');
  });
});
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `pnpm --filter @smart-lock/env test -- definitions.spec.ts`

Expected: FAIL，提示 definitions/runtime 模块不存在。

- [ ] **Step 3: 实现变量定义**

`serverDefinitions` 必须完整声明以下键，且 `serverEnvSchema` 由这些定义的 `schema` 字段构造，不能再维护第二份键名列表：

| 分组        | 键                                                      | 规则                                              |
| ----------- | ------------------------------------------------------- | ------------------------------------------------- |
| server      | `NODE_ENV`                                              | `development/test/production`，默认 `development` |
| server      | `PORT`                                                  | 1-65535 整数，默认 3000，别名 `API_PORT`          |
| server      | `NEXT_PUBLIC_APP_URL`                                   | 可选 URL，保留现有 CORS 行为                      |
| server      | `DEBUG_KEY`                                             | secret，最少 16 字符，本地随机生成                |
| database    | `DATABASE_USER`                                         | 默认 `postgres`                                   |
| database    | `DATABASE_PASSWORD`                                     | secret，本地随机生成                              |
| database    | `DATABASE_NAME`                                         | 默认 `smart_lock`                                 |
| database    | `DATABASE_URL`                                          | PostgreSQL URL，根据前三项生成                    |
| server      | `JWT_SECRET`                                            | secret，最少 32 字符，本地随机生成                |
| server      | `JWT_EXPIRES_IN`                                        | 非空字符串，默认 `1d`                             |
| third-party | `MAIL_HOST`、`MAIL_USER`、`MAIL_PASS`、`MAIL_FROM_NAME` | 必填非空字符串，密码标记 secret                   |
| third-party | `MAIL_PORT`                                             | 1-65535 整数字符串                                |
| third-party | `ALIYUN_ACCESS_KEY_ID`、`ALIYUN_ACCESS_KEY_SECRET`      | 必填，secret                                      |
| third-party | `ALIYUN_SMS_SIGN_NAME`、`ALIYUN_SMS_TEMPLATE_CODE`      | 必填                                              |
| third-party | `ALIYUN_STS_ROLE_ARN`                                   | 必填                                              |
| third-party | `ALIYUN_STS_ROLE_SESSION_NAME`                          | 默认 `SmartLockApp`                               |
| third-party | `ALIYUN_STS_POLICY`                                     | 可选，默认空字符串                                |
| third-party | `ALIYUN_STS_DURATION_SECONDS`                           | 正整数，默认 `3600`                               |
| server      | `SUPER_ADMIN_USERNAME`、`SUPER_ADMIN_PASSWORD`          | 必填，密码标记 secret                             |

`clientDefinitions` 只声明 `EXPO_PUBLIC_API_URL` 和 `EXPO_PUBLIC_SOCKET_URL`。开发默认值分别为 `http://localhost:3000/api` 和 `http://localhost:3000`；Socket 键声明别名 `EXPO_PUBLIC_NOTICATION`。生产模式通过 `parseClientEnv(input, { production: true })` 禁止使用缺失值或 localhost 默认值。

`API_HOST` 和 `API_URL` 不进入新契约；检查器将它们报告为未知旧配置，但不自动删除。

- [ ] **Step 4: 实现别名解析与客户端映射**

```ts
export const parseClientEnv = (
  input: Record<string, string | undefined>,
  options: { production?: boolean } = {}
) => {
  const resolved = resolveDeprecatedAliases(
    input,
    { EXPO_PUBLIC_SOCKET_URL: ['EXPO_PUBLIC_NOTICATION'] },
    console.warn
  );
  const parsed = clientEnvSchema.parse(resolved);
  if (options.production && Object.values(parsed).some(value => value.includes('localhost'))) {
    throw new Error('[invalid] 生产环境客户端 URL 不能指向 localhost');
  }
  return { apiUrl: parsed.EXPO_PUBLIC_API_URL, socketUrl: parsed.EXPO_PUBLIC_SOCKET_URL };
};
```

- [ ] **Step 5: 运行测试和类型构建**

Run: `pnpm --filter @smart-lock/env test -- definitions.spec.ts`

Expected: PASS，全部契约、客户端和别名断言通过。

Run: `pnpm --filter @smart-lock/env build`

Expected: PASS；`@smart-lock/env/client` 的依赖图不包含 `node:fs`、`node:path` 或 `dotenv`。

- [ ] **Step 6: 提交契约定义**

```bash
git add -- packages/env/src packages/env/tsup.config.ts
git commit -m "feat(env): define server and client configuration contracts"
```

## Task 3: 实现工作区根定位和服务端加载器

**Files:**

- Create: `packages/env/src/runtime/workspace-root.ts`
- Create: `packages/env/src/runtime/workspace-root.spec.ts`
- Create: `packages/env/src/runtime/server.ts`
- Create: `packages/env/src/runtime/server.spec.ts`

- [ ] **Step 1: 编写根目录查找和敏感错误测试**

```ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

it('从嵌套目录向上找到 pnpm-workspace.yaml', () => {
  const root = mkdtempSync(join(tmpdir(), 'smart-lock-env-'));
  const nested = join(root, 'apps', 'api');
  mkdirSync(nested, { recursive: true });
  writeFileSync(join(root, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n");
  expect(findWorkspaceRoot(nested)).toBe(root);
  rmSync(root, { recursive: true, force: true });
});

it('一次报告全部错误且不包含秘密实际值', () => {
  let message = '';
  try {
    loadServerEnv({
      source: { JWT_SECRET: 'short-secret-value' },
      loadDotEnv: false,
    });
  } catch (error) {
    message = String(error);
  }
  expect(message).toContain('JWT_SECRET');
  expect(message).not.toContain('short-secret-value');
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @smart-lock/env test -- workspace-root.spec.ts server.spec.ts`

Expected: FAIL，提示 `findWorkspaceRoot` 和 `loadServerEnv` 不存在。

- [ ] **Step 3: 实现根目录查找**

从 `resolve(startDirectory)` 开始逐级检查 `pnpm-workspace.yaml`。到达盘符根目录仍未找到时抛出：`Unable to locate pnpm workspace from <startDirectory>`。不得回退到 `../../.env`。

- [ ] **Step 4: 实现可测试的服务端加载器**

```ts
export interface LoadServerEnvOptions {
  startDirectory?: string;
  source?: NodeJS.ProcessEnv;
  loadDotEnv?: boolean;
  onWarning?: (message: string) => void;
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
```

Zod 错误格式化器必须输出所有 `issue.path` 和 `issue.message`，不能拼接原始输入值。

- [ ] **Step 5: 运行定向测试和构建**

Run: `pnpm --filter @smart-lock/env test -- workspace-root.spec.ts server.spec.ts`

Expected: PASS。

Run: `pnpm --filter @smart-lock/env build`

Expected: PASS。

- [ ] **Step 6: 提交服务端加载器**

```bash
git add -- packages/env/src/runtime
git commit -m "feat(env): load validated configuration from workspace root"
```

## Task 4: 实现安全的 `.env` 初始化

**Files:**

- Create: `packages/env/scripts/lib/env-file.ts`
- Create: `packages/env/scripts/lib/env-file.spec.ts`
- Create: `packages/env/scripts/init.ts`
- Modify: `packages/env/package.json`

- [ ] **Step 1: 编写创建、增量追加和幂等测试**

```ts
import { z } from 'zod';

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

it('只追加缺失键并保留原内容逐字不变', () => {
  const original = '# local\nPORT=4100\nJWT_SECRET=keep-this-secret-value-123456\n';
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
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @smart-lock/env test -- env-file.spec.ts`

Expected: FAIL，提示 `updateEnvFile` 不存在。

- [ ] **Step 3: 实现只追加算法和派生值顺序**

读取现有行得到键集合，但不重新序列化已有内容。按 definitions 的稳定顺序解析默认值与生成器：先 `DATABASE_USER`、`DATABASE_PASSWORD`、`DATABASE_NAME`，再使用 `encodeURIComponent` 构造 `DATABASE_URL`；`JWT_SECRET` 和 `DEBUG_KEY` 使用 `randomBytes(32).toString('hex')`。只将缺失键作为一个带分组注释的新块追加到文件尾部。

- [ ] **Step 4: 实现 CLI 退出规则**

`scripts/init.ts` 定位根 `.env`、调用 `updateEnvFile`，随后调用完整校验。若仅剩必填第三方凭据为空，保留已生成文件、打印 `[missing]` 清单并设置 `process.exitCode = 1`；绝不打印 secret 值。

- [ ] **Step 5: 使用临时目录运行测试**

Run: `pnpm --filter @smart-lock/env test -- env-file.spec.ts`

Expected: PASS，且测试没有修改仓库根 `.env`。

- [ ] **Step 6: 提交初始化工具**

```bash
git add -- packages/env/scripts/lib/env-file.ts packages/env/scripts/lib/env-file.spec.ts packages/env/scripts/init.ts packages/env/package.json
git commit -m "feat(env): add non-destructive environment initializer"
```

## Task 5: 生成示例和 README，并校验 Compose 契约

**Files:**

- Create: `packages/env/scripts/lib/generate.ts`
- Create: `packages/env/scripts/lib/generate.spec.ts`
- Create: `packages/env/scripts/lib/contract-check.ts`
- Create: `packages/env/scripts/lib/contract-check.spec.ts`
- Create: `packages/env/scripts/generate.ts`
- Create: `packages/env/scripts/check.ts`
- Modify: `packages/env/package.json`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: 编写生成器和 Compose 检查失败测试**

```ts
it('生成示例时不输出 secret 默认值', () => {
  const output = renderEnvExample({ ...serverDefinitions, ...clientDefinitions });
  expect(output).toContain('JWT_SECRET=');
  expect(output).not.toMatch(/^JWT_SECRET=.+$/m);
});

it('只替换 README 标记区域', () => {
  const source = 'before\n<!-- ENV_TABLE_START -->\nold\n<!-- ENV_TABLE_END -->\nafter\n';
  expect(updateReadmeEnvTable(source, '| variable |')).toBe(
    'before\n<!-- ENV_TABLE_START -->\n| variable |\n<!-- ENV_TABLE_END -->\nafter\n'
  );
});

it('报告未注册的 Compose 变量', () => {
  const knownKeys = new Set(Object.keys({ ...serverDefinitions, ...clientDefinitions }));
  expect(
    checkComposeVariables('services:\n  db:\n    environment:\n      X: ${UNKNOWN}', knownKeys)
  ).toEqual(['[unknown] UNKNOWN: Docker Compose 引用了未注册变量']);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @smart-lock/env test -- generate.spec.ts contract-check.spec.ts`

Expected: FAIL，提示生成和检查函数不存在。

- [ ] **Step 3: 实现稳定生成和 `--check`**

`.env.example` 按 `server`、`database`、`client-public`、`third-party` 排序。README 表包含“变量名、作用域、必填、默认值、说明”五列；secret 默认值显示 `-`。README 中不存在标记时命令失败，不自行猜测替换位置。`--check` 只比较内存结果并返回非零状态，不写文件。

- [ ] **Step 4: 使用 YAML 解析 Compose**

使用 `yaml.parseDocument()` 遍历字符串标量，并用 `/\$\{([A-Z][A-Z0-9_]*)(?::-[^}]*)?\}/g` 提取引用。当前 Compose 的 `DATABASE_USER`、`DATABASE_PASSWORD`、`DATABASE_NAME` 必须全部匹配契约。

- [ ] **Step 5: 在 README 加入生成标记并生成提交产物**

Run: `pnpm --filter @smart-lock/env env:generate`

Expected: `.env.example` 和 README 标记区域被更新，不读取根 `.env`。

Run: `pnpm --filter @smart-lock/env env:generate -- --check`

Expected: PASS，生成文件已同步。

Run: `pnpm --filter @smart-lock/env env:check -- --contract`

Expected: PASS，Compose 没有未注册变量。

- [ ] **Step 6: 提交生成器和提交产物**

```bash
git add -- packages/env/scripts packages/env/package.json .env.example README.md
git commit -m "feat(env): generate documentation and validate compose references"
```

## Task 6: 接入根命令和 Turbo 缓存输入

**Files:**

- Modify: `package.json`
- Modify: `turbo.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 添加根命令**

```json
{
  "env:init": "pnpm --filter @smart-lock/env env:init",
  "env:check": "pnpm --filter @smart-lock/env env:check",
  "env:generate": "pnpm --filter @smart-lock/env env:generate"
}
```

- [ ] **Step 2: 将根 `.env` 纳入需要环境的任务输入**

在 `turbo.json` 设置 `globalDependencies` 为 `['.env', '.env.*local']`，确保环境变化不会复用错误缓存；不要把 secret 值写入任务输出。

- [ ] **Step 3: 验证根命令路由正确**

Run: `pnpm env:generate --check`

Expected: PASS。

Run: `pnpm env:check --contract`

Expected: PASS。

- [ ] **Step 4: 提交工作区接线**

```bash
git add -- package.json turbo.json pnpm-lock.yaml
git commit -m "chore(env): expose workspace configuration commands"
```

## Task 7: 将 API 迁移到类型化配置

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/api/src/config/config.provider.ts`
- Modify: `apps/api/src/config/config.module.ts`
- Create: `apps/api/src/config/config.provider.spec.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/common/cache/controllers/cache.controller.ts`
- Modify: `apps/api/src/common/exceptions/http-exception.filter.ts`
- Modify: `apps/api/src/common/interceptors/interceptors.module.ts`
- Modify: `apps/api/src/common/interceptors/pagination.interceptor.ts`
- Modify: `apps/api/src/common/interceptors/transform.interceptor.ts`
- Modify: `apps/api/src/common/logger/app-logger.service.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 编写 Config Provider 失败测试**

```ts
it('将加载器返回的对象注册为 APP_CONFIG', () => {
  const expected = { PORT: 3000, JWT_SECRET: 'a'.repeat(64) } as AppConfig;
  const provider = createAppConfigProvider(() => expected);
  expect(provider.provide).toBe(APP_CONFIG);
  expect(provider.useValue).toBe(expected);
});
```

`createAppConfigProvider(loader = loadServerEnv)` 是可测试的 Provider 工厂；测试传入固定 loader，不能读取真实 `.env`。

- [ ] **Step 2: 运行测试并确认旧 Provider 不包含完整契约**

Run: `pnpm --filter @smart-lock/api test -- config.provider.spec.ts --runInBand`

Expected: FAIL，旧 `AppConfig` 没有 `PORT` 或无法注入测试配置。

- [ ] **Step 3: 用 env 包替换 API 自有 Schema**

`config.provider.ts` 只保留 Nest token、`AppConfig = ServerEnv` 类型和一次缓存的 `loadServerEnv()` 结果。`config.module.ts` 使用 `useValue` 提供该对象。删除 API 内重复的 Zod Schema。

在 `apps/api/package.json` 增加 `@smart-lock/env: workspace:*`，不再直接依赖 API 自有环境 Schema。

- [ ] **Step 4: 迁移启动与基础设施配置**

`main.ts` 使用 `appConfig.PORT` 和 `appConfig.NEXT_PUBLIC_APP_URL`；删除 `dotenv.config()`。`app.module.ts` 使用同一个 `appConfig.NODE_ENV` 配置 Logger。`CacheDebugController` 注入 `APP_CONFIG` 并读取 `DEBUG_KEY`。

`HttpExceptionFilter`、两个 Interceptor 和 Logger 的构造参数接收 `isDevelopment`；对应 Nest factory 从 `APP_CONFIG` 传入 `config.NODE_ENV !== 'production'`。不得在这些文件留下 `process.env`。

- [ ] **Step 5: 运行 API 测试、构建和定向搜索**

Run: `pnpm --filter @smart-lock/api test -- config.provider.spec.ts --runInBand`

Expected: PASS。

Run: `pnpm --filter @smart-lock/api build`

Expected: PASS。

Run: `rg -n "process\.env|dotenv" apps/api/src`

Expected: 无匹配。

- [ ] **Step 6: 提交 API 迁移**

```bash
git add -- apps/api/package.json apps/api/src/config apps/api/src/main.ts apps/api/src/app.module.ts apps/api/src/common/cache/controllers/cache.controller.ts apps/api/src/common/exceptions/http-exception.filter.ts apps/api/src/common/interceptors apps/api/src/common/logger/app-logger.service.ts pnpm-lock.yaml
git commit -m "refactor(api): consume centralized environment configuration"
```

## Task 8: 将数据库和 Drizzle 迁移到根配置

**Files:**

- Modify: `packages/shared/package.json`
- Modify: `packages/shared/src/db/db.ts`
- Create: `packages/shared/src/db/db-config.spec.ts`
- Modify: `packages/shared/src/server/index.ts`
- Modify: `packages/shared/drizzle.config.ts`
- Modify: `packages/shared/tsup.config.ts`
- Delete: `packages/shared/.env`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 编写数据库配置失败测试**

```ts
it('从 ServerEnv 创建连接选项', () => {
  expect(
    createPoolConfig({ DATABASE_URL: 'postgresql://u:p@localhost:5432/db' } as ServerEnv)
  ).toMatchObject({ connectionString: 'postgresql://u:p@localhost:5432/db' });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @smart-lock/shared test -- db-config.spec.ts --runInBand`

Expected: FAIL，提示 `createPoolConfig` 不存在。

- [ ] **Step 3: 移除数据库包的独立 dotenv 加载**

`db.ts` 调用 `loadServerEnv()` 一次，并将 `DATABASE_URL` 传给纯函数 `createPoolConfig`。`drizzle.config.ts` 同样使用 `loadServerEnv().DATABASE_URL`。`src/server/index.ts` 删除异步动态导入 dotenv 的整个块。`tsup.config.ts` 不再维护 dotenv 空实现别名。

在 `packages/shared/package.json` 增加 `@smart-lock/env: workspace:*`，移除已经不再使用的 dotenv peer dependency 和对应 peer metadata。

- [ ] **Step 4: 删除重复真实值文件前进行保护检查**

Run: `git diff -- packages/shared/.env`

确认其中没有需要迁回根 `.env` 的唯一键。只能删除仓库中的重复文件，不能修改根 `.env`。若发现唯一键，停止并先让用户决定迁移值。

- [ ] **Step 5: 运行 shared 测试、构建和 Drizzle 配置加载**

Run: `pnpm --filter @smart-lock/shared test -- db-config.spec.ts --runInBand`

Expected: PASS。

Run: `pnpm --filter @smart-lock/shared build`

Expected: PASS。

Run: `pnpm --filter @smart-lock/shared exec drizzle-kit check`

Expected: 配置成功加载；若当前 drizzle-kit 版本不支持 `check`，改用 `pnpm --filter @smart-lock/shared exec drizzle-kit --help` 加载配置模块并记录该限制，不执行迁移。

- [ ] **Step 6: 提交数据库迁移**

```bash
git add -- packages/shared/package.json packages/shared/src/db packages/shared/src/server/index.ts packages/shared/drizzle.config.ts packages/shared/tsup.config.ts packages/shared/.env pnpm-lock.yaml
git commit -m "refactor(db): use centralized workspace environment"
```

## Task 9: 将 Expo 和共享 API 客户端迁移到公开配置入口

**Files:**

- Modify: `apps/client/package.json`
- Create: `apps/client/config/env.ts`
- Create: `apps/client/config/env.spec.ts`
- Modify: `apps/client/contexts/api-context.tsx`
- Modify: `apps/client/contexts/notification-context.tsx`
- Modify: `apps/client/hooks/useDeviceSocket.ts`
- Delete: `apps/client/.env`
- Modify: `packages/shared/src/api/factory/api-factory.ts`
- Modify: `packages/shared/src/api/adapters/platform-adapter.ts`
- Modify: `packages/shared/src/api/adapters/browser-adapter.ts`
- Modify: `packages/shared/src/api/adapters/react-native-adapter.ts`
- Modify: `packages/shared/src/api/adapters/react-native-error-handler.ts`
- Modify: `packages/shared/src/api/examples/react-native-example.ts`
- Modify: `packages/shared/src/shared/types/global.d.ts`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: 编写客户端公开配置失败测试**

```ts
describe('clientEnv', () => {
  it('映射 API 和 Socket URL', () => {
    expect(
      createClientEnv(
        {
          EXPO_PUBLIC_API_URL: 'http://localhost:3000/api',
          EXPO_PUBLIC_SOCKET_URL: 'http://localhost:3000',
        },
        false
      )
    ).toEqual({
      apiUrl: 'http://localhost:3000/api',
      socketUrl: 'http://localhost:3000',
    });
  });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `pnpm --filter @smart-lock/client exec jest config/env.spec.ts --runInBand`

Expected: FAIL，提示 `createClientEnv` 不存在。

- [ ] **Step 3: 创建唯一 Expo 环境入口**

```ts
export const createClientEnv = (source: Record<string, string | undefined>, production: boolean) =>
  parseClientEnv(source, { production });

export const clientEnv = createClientEnv(
  {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
    EXPO_PUBLIC_NOTICATION: process.env.EXPO_PUBLIC_NOTICATION,
  },
  !__DEV__
);
```

旧拼写只在兼容入口读取并产生弃用警告。所有 Context 和 Hook 改用 `clientEnv.apiUrl` 或 `clientEnv.socketUrl`，删除远程隧道硬编码地址和调试 Toast。

- [ ] **Step 4: 显式加载根 `.env` 并收紧共享 API 接口**

在客户端脚本的 `expo` 前加入 `dotenv -e ../../.env --`，并添加 `dotenv-cli` 开发依赖。`ApiFactory.createClient` 将 `baseURL` 改为必填；从 `PlatformAdapter` 及浏览器、React Native 实现中删除 `getEnv`。React Native 错误处理器通过构造选项接收 `isDevelopment: __DEV__`，不再读取 `process.env.NODE_ENV`。

在 `apps/client/package.json` 增加 `@smart-lock/env: workspace:*`。

- [ ] **Step 5: 删除空的客户端 `.env` 并验证**

Run: `git diff -- apps/client/.env`

Expected: 文件为空或没有唯一配置；如包含值则停止并让用户确认。

Run: `pnpm --filter @smart-lock/client exec jest config/env.spec.ts --runInBand`

Expected: PASS。

Run: `pnpm --filter @smart-lock/shared test --runInBand`

Expected: PASS。

Run: `pnpm --filter @smart-lock/client exec tsc --noEmit`

Expected: PASS。

- [ ] **Step 6: 提交客户端迁移**

```bash
git add -- apps/client/package.json apps/client/config apps/client/contexts/api-context.tsx apps/client/contexts/notification-context.tsx apps/client/hooks/useDeviceSocket.ts apps/client/.env packages/shared/src/api packages/shared/src/shared/types/global.d.ts pnpm-lock.yaml
git commit -m "refactor(client): centralize public environment access"
```

## Task 10: 启用静态约束并完成全链路验证

**Files:**

- Modify: `eslint.config.mjs`
- Modify: `apps/admin/src/lib/aip-service.ts`
- Modify: `.gitignore`
- Modify: `README.md`

- [ ] **Step 1: 添加 ESLint 禁止规则**

对 TypeScript 业务文件加入两个 `no-restricted-syntax` selector：

```js
{
  selector: "MemberExpression[object.object.name='process'][object.property.name='env']",
  message: 'Use a typed @smart-lock/env entry instead of process.env.',
},
{
  selector: "MemberExpression[object.type='MemberExpression'][object.object.type='MetaProperty'][object.property.name='env'][property.name!='DEV']",
  message: 'Use an app-specific typed env entry instead of import.meta.env.',
}
```

仅对 `packages/env/**/*` 和 `apps/client/config/env.ts` 使用精确文件覆盖关闭第一条规则。`import.meta.env.DEV` 作为 Vite 内建模式标记允许保留；删除 `aip-service.ts` 中已注释的 `VITE_API_URL` 旧示例。

- [ ] **Step 2: 加强 Git 忽略规则和 README 使用说明**

确保 `.gitignore` 忽略根和子目录真实 `.env`，但显式允许 `!.env.example`。README 人工维护区域只说明以下流程，不复制变量表：

```bash
pnpm env:init
pnpm env:check
pnpm env:generate --check
```

- [ ] **Step 3: 运行环境契约和直接访问审计**

Run: `pnpm env:generate --check`

Expected: PASS。

Run: `pnpm env:check --contract`

Expected: PASS。

Run: `rg -n "process\.env|import\.meta\.env" apps packages -g '*.{ts,tsx}' -g '!packages/env/**' -g '!apps/client/config/env.ts' -g '!packages/shared/tsup.config.ts'`

Expected: 只允许 `apps/admin/src/lib/aip-service.ts` 的 `import.meta.env.DEV`；无自定义变量直接访问。

- [ ] **Step 4: 运行完整测试、构建和格式检查**

Run: `pnpm --filter @smart-lock/env test`

Expected: PASS，0 failed。

Run: `pnpm --filter @smart-lock/env build`

Expected: PASS。

Run: `pnpm --filter @smart-lock/shared test --runInBand`

Expected: PASS。

Run: `pnpm --filter @smart-lock/shared build`

Expected: PASS。

Run: `pnpm --filter @smart-lock/api test --runInBand`

Expected: PASS，0 failed。

Run: `pnpm --filter @smart-lock/api build`

Expected: PASS。

Run: `pnpm --filter @smart-lock/client exec jest config/env.spec.ts --runInBand`

Expected: PASS。

Run: `pnpm --filter @smart-lock/client exec tsc --noEmit`

Expected: PASS。

Run: `pnpm lint`

Expected: PASS；若仓库已有无关错误，记录完整错误并额外运行所有本次改动文件的定向 ESLint，不能把无关失败描述为本次通过。

Run: `pnpm exec prettier --check "packages/env/**/*.{ts,json}" ".env.example" "README.md" "apps/client/config/env.ts"`

Expected: PASS。

Run: `git diff --check`

Expected: PASS。

- [ ] **Step 5: 手工验证根 `.env` 初始化，必须先获得用户确认**

在真实工作区运行 `pnpm env:init` 会增量修改用户的根 `.env`，因此执行前展示将新增的键并取得明确确认。执行后验证已有键值的哈希未变化，只新增缺失键；不得在终端输出实际 secret。

- [ ] **Step 6: 提交静态约束和文档收尾**

```bash
git add -- eslint.config.mjs apps/admin/src/lib/aip-service.ts .gitignore README.md
git commit -m "chore(env): enforce typed environment access"
```

- [ ] **Step 7: 核对提交边界**

Run: `git status --short`

Expected: 用户原有未提交改动仍保持原状态；本计划的实现文件均已提交，没有 `.env` 或真实凭据进入任何提交。
