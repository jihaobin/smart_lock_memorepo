# 环境变量集中管理重构设计

## 背景

当前环境变量分散在根 `.env`、`.env.example`、应用代码、共享包、README 和 Docker Compose 中。新增或重命名变量时需要同步修改多处，缺少自动校验，容易出现遗漏和命名漂移。

已确认的典型问题包括：

- API 已有 Zod 配置 Schema，但 `main.ts` 仍直接读取 `process.env`。
- 数据库运行时与 Drizzle 配置分别调用 `dotenv.config()`，并通过相对路径查找 `.env`。
- Expo 客户端在多个 Context 和 Hook 中重复读取环境变量并维护硬编码回退地址。
- `.env.example`、README 环境变量表和实际变量清单不同步。
- `API_PORT` 与运行时代码读取的 `PORT` 不一致。
- `EXPO_PUBLIC_NOTICATION` 存在拼写和语义问题，并被多个客户端文件重复使用。
- `apps/client/.env`、`packages/shared/.env` 与根 `.env` 形成多份真实值来源。

## 目标

- 每个环境变量只维护一份结构定义。
- 根目录 `.env` 成为唯一的本地真实值文件。
- API、数据库、Expo、管理端和 Docker Compose 受同一配置契约约束。
- 自动生成 `.env.example` 和 README 环境变量表。
- 新增或重命名变量时，由本地检查和 CI 阻止遗漏。
- 在类型和构建边界上隔离客户端公开变量与服务端敏感变量。
- 初始化和升级本地 `.env` 时不覆盖任何已有值。

## 非目标

- 本次不接入云端密钥管理服务。
- 本次不统一开发、测试和生产环境的密钥分发流程。
- 本次不生成或提交包含真实凭据的文件。
- 本次不整体生成 Docker Compose 文件，只校验其中的环境变量引用。
- 本次不重构与配置读取无关的业务模块。

## 方案选择

采用 TypeScript 配置契约包 `packages/env`。变量定义、Zod 校验、类型和生成元数据使用同一套 TypeScript 源码维护。

未采用以下方案：

- 各应用独立维护 Schema：应用自治较强，但共享变量仍可能重复声明。
- YAML 或 JSON 清单驱动代码生成：单一来源彻底，但会引入额外代码生成层，对当前 TypeScript 仓库复杂度偏高。

## 总体架构

```text
packages/env
├── src
│   ├── definitions
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── metadata.ts
│   ├── runtime
│   │   ├── server.ts
│   │   └── client.ts
│   └── index.ts
└── scripts
    ├── init.ts
    ├── check.ts
    └── generate.ts
```

职责划分：

- `definitions` 定义变量名、说明、作用域、Schema、默认值、敏感级别和本地生成方式。
- `runtime/server` 负责加载根 `.env`、解析服务端变量并返回类型化配置。
- `runtime/client` 提供客户端公开变量的 Schema 和解析函数，不导出任何服务端变量。
- `init.ts` 创建或增量补全本地 `.env`。
- `check.ts` 校验真实环境、配置契约、代码引用和 Docker Compose 引用。
- `generate.ts` 生成 `.env.example` 和 README 环境变量表。

## 配置定义模型

每个变量至少包含以下元数据：

```ts
interface EnvDefinition {
  description: string;
  group: 'server' | 'client-public' | 'database' | 'third-party';
  schema: z.ZodType;
  required: boolean;
  secret: boolean;
  defaultValue?: string | number | boolean;
  generateLocalValue?: (resolvedValues: Record<string, string>) => string;
  deprecatedAliases?: string[];
}
```

约束如下：

- `client-public` 变量必须使用运行框架要求的公开前缀。
- `secret: true` 的变量不能出现在客户端导出、日志或带真实值的生成产物中。
- 纯本地密钥可以设置 `generateLocalValue`。
- 存在依赖关系的本地值按定义顺序生成；例如先生成数据库用户名、密码和数据库名，再使用这些值构造 `DATABASE_URL`。
- 第三方凭据不得设置可用的默认值或自动生成值。
- 默认值必须经过同一 Zod Schema 校验。
- 每个旧变量别名必须绑定唯一的新变量，并输出弃用警告。

## `.env` 初始化

根目录 `.env` 是唯一包含真实本地值的配置文件，不提交到 Git。

提供命令：

```bash
pnpm env:init
```

首次初始化：

1. 按配置分组和稳定顺序生成根 `.env`。
2. 普通变量写入契约中的本地默认值。
3. `JWT_SECRET`、本地数据库密码等纯本地密钥通过 `crypto.randomBytes()` 生成。
4. `DATABASE_URL` 使用同一次初始化得到的数据库用户名、密码和数据库名构造，确保与 Docker Compose 配置一致。
5. 阿里云、邮件等第三方凭据保持空值。
6. 生成完成后运行完整本地校验，并汇总仍需人工填写的变量。

增量初始化：

1. 读取已有键名，但不重新序列化整个 `.env`。
2. 只在文件末尾追加缺失变量及其说明。
3. 不修改已有值、顺序或注释。
4. 对未知变量和废弃别名只输出警告，不自动删除。
5. 空的必填第三方凭据仍视为待配置项。

该策略保证重复执行 `pnpm env:init` 幂等，并避免因为格式化或解析器行为覆盖本地密钥。

## 运行时接入

### API

保留现有 Nest `APP_CONFIG` 注入边界。Config Module 使用 `loadServerEnv()` 的解析结果提供配置，业务服务继续注入类型化的 `AppConfig`。

`main.ts` 在应用初始化后从 `APP_CONFIG` 读取端口和 CORS 配置，不再直接访问 `process.env`。日志、异常处理等需要环境模式的代码也逐步改为注入或接收类型化配置。

### 数据库和 Drizzle

数据库运行时与 `drizzle.config.ts` 使用同一个服务端加载器。不再自行调用 `dotenv.config()`，也不再依赖 `../../.env` 这类与当前工作目录相关的路径。

配置加载器从调用方当前目录开始向上查找 `pnpm-workspace.yaml`，以其所在目录作为仓库根目录，再解析根 `.env`。找不到工作区标记时直接失败并报告搜索起点，不回退到不确定的相对路径。工具脚本和应用运行时共享该定位规则。

### Expo 客户端

Expo 需要直接属性访问才能可靠完成公开变量的静态替换，因此客户端保留一个受控入口：

```ts
export const clientEnv = parseClientEnv({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL,
});
```

该文件是客户端唯一允许直接访问 `process.env` 的业务入口。其他 Context、Hook 和共享适配器只使用 `clientEnv`。

Expo 启动命令显式将根 `.env` 注入进程，不再依赖 `apps/client/.env`。

### 管理端

管理端如需 Vite 环境变量，使用独立的 `adminEnv` 入口和对应公开 Schema。Expo 的 `EXPO_PUBLIC_*` 与 Vite 的 `VITE_*` 不互相复用，也不直接读取服务端配置。

### Docker Compose

Docker Compose 继续原生读取根 `.env`。检查脚本使用 YAML 解析器读取 Compose 文件，提取 `${VAR}` 和 `${VAR:-default}` 引用，并验证每个引用都已在配置契约中声明。

## 生成文件

提供命令：

```bash
pnpm env:generate
pnpm env:generate --check
```

`.env.example` 完整生成并允许覆盖，按配置组稳定排序。敏感变量只输出空值或不可误用的占位符，不读取本地 `.env`。

README 使用以下标记限定生成区域：

```html
<!-- ENV_TABLE_START -->
<!-- ENV_TABLE_END -->
```

生成器只替换标记之间的环境变量表，保留 README 其余人工内容。生成表包含变量名、作用域、是否必填、默认值和说明，但不展示敏感值。

`--check` 在内存中生成预期内容并与仓库文件比较；存在差异时返回非零退出码，不修改文件。

## 校验与错误处理

提供两种校验模式：

```bash
pnpm env:check
pnpm env:check --contract
```

本地完整校验读取根 `.env` 并检查：

- 必填项是否存在且非空。
- URL、端口、枚举、布尔值和密钥长度是否合法。
- 是否存在未知变量和废弃别名。
- 客户端是否引用服务端或敏感变量。
- Docker Compose 引用是否已注册。

契约校验不读取真实 `.env`，用于 CI 检查：

- 变量定义和默认值是否自洽。
- 客户端与服务端导出边界是否正确。
- Compose 引用是否已注册。
- 生成文件是否与契约同步。
- 业务代码是否绕过类型化入口直接读取环境变量。

错误使用稳定分类输出：

```text
[missing] ALIYUN_ACCESS_KEY_ID: 必填的第三方凭据尚未配置
[invalid] PORT: 应为 1-65535 之间的整数
[deprecated] API_PORT: 请迁移为 PORT
[unknown] EXPO_PUBLIC_NOTICATION: 请迁移为 EXPO_PUBLIC_SOCKET_URL
[exposure] DATABASE_URL: 服务端变量不能由 Expo 客户端引用
```

Schema 校验失败时一次性报告全部问题，而不是在第一个错误处停止。错误信息不得包含敏感变量的实际值。

`env:init` 始终先安全写入已经能够生成的内容。若写入后仍缺少必填第三方凭据，命令输出待填写清单并返回非零退出码；填写后重新执行即可通过。该失败不能回滚或删除已经生成的本地值。

## 静态约束

ESLint 禁止业务代码直接访问 `process.env` 和 `import.meta.env`。以下位置允许访问：

- `packages/env` 内部加载器和生成脚本。
- Expo 与管理端各自唯一的公开配置入口。
- 必须由构建工具直接读取环境变量的配置文件。

允许列表使用明确文件路径，不能按整个应用目录放行。动态属性访问和将完整 `process.env` 传给其他模块同样禁止。

## 变量迁移

第一阶段提供一个迁移周期的兼容别名：

```text
API_PORT -> PORT
EXPO_PUBLIC_NOTICATION -> EXPO_PUBLIC_SOCKET_URL
```

新变量缺失而旧变量存在时，运行时继续使用旧值并打印弃用警告。新旧变量同时存在时始终使用新变量，并提示删除旧变量。`env:init` 只补充新变量，不复制或删除已有真实值。

第二阶段移除别名及对应兼容测试。移除动作应独立提交，并在移除前确认部署环境已完成迁移。

客户端现有远程隧道硬编码回退地址全部删除。本地地址由契约提供默认值；生产构建缺少 API 或 Socket 地址时直接失败。

## 文件迁移

- 保留根 `.env`，由 `env:init` 增量补全。
- 删除空的 `apps/client/.env`。
- 删除 `packages/shared/.env`，数据库和工具统一读取根 `.env`。
- 更新 `.gitignore`，确保真实环境文件不会被新路径重新提交。
- `.env.example` 转为完全生成的提交文件。
- README 环境变量表转为局部生成内容。

实际实施时必须保留用户工作区中已有的真实值；删除重复 `.env` 前先验证对应运行入口已经切换到根 `.env`。

## 测试策略

### 单元测试

- Schema 必填、默认值、类型转换、URL、端口和密钥长度。
- 本地密钥生成器的格式和最小强度。
- `env:init` 首次生成、增量追加和重复执行幂等性。
- 已有值、顺序和注释不被修改。
- 生成器输出稳定且不包含真实秘密。
- 旧变量别名优先级和弃用警告。

### 集成与静态测试

- API 能通过 `APP_CONFIG` 获取端口、CORS、认证和第三方配置。
- 数据库运行时与 Drizzle 使用相同的 `DATABASE_URL`。
- Expo 客户端能解析两个公开 URL，且无法导入服务端变量。
- Docker Compose 中全部环境变量引用均已注册。
- 业务目录不存在未放行的直接环境变量访问。
- `.env.example` 与 README 的生成检查通过。

## CI

CI 不依赖开发者 `.env`，也不要求提供第三方真实凭据。新增检查命令：

```bash
pnpm env:generate --check
pnpm env:check --contract
pnpm lint
pnpm test
```

涉及真实部署环境的完整值校验在部署阶段执行，不在普通拉取请求检查中执行。

## 验收标准

- 新增普通变量时，只需要修改一次 `packages/env` 定义。
- `pnpm env:init` 能创建或安全补全根 `.env`，不覆盖已有值。
- `.env.example` 和 README 环境变量表完全由契约生成。
- API、数据库、Drizzle、Expo 和管理端不再各自加载或解释环境变量。
- Docker Compose 的变量引用受契约检查。
- 客户端构建不能访问或包含服务端敏感变量。
- 业务代码新增直接环境变量访问时，Lint 或契约检查失败。
- 旧变量在兼容期内产生清晰警告，迁移完成后可独立移除。
