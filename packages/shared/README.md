# @smart-lock/shared

智能锁项目的数据库、API 客户端和跨应用共享代码。完整依赖关系见 [开发与交接指南](../../docs/development-guide.md)。

## 导出入口

```typescript
import { ErrorCode } from '@smart-lock/shared';
import type { AdminAuthUser } from '@smart-lock/shared/shared';
import { ApiFactory, BrowserAdapter } from '@smart-lock/shared/api';
import { db } from '@smart-lock/shared/server';
```

| 子路径                      | 用途                                        |
| --------------------------- | ------------------------------------------- |
| `@smart-lock/shared`        | 根级通用导出                                |
| `@smart-lock/shared/shared` | 类型、常量和通用工具                        |
| `@smart-lock/shared/api`    | API 客户端、查询 Hook、错误处理和平台适配器 |
| `@smart-lock/shared/client` | 客户端专用导出                              |
| `@smart-lock/shared/server` | 数据库 Schema、连接和服务端导出             |

React Native 和浏览器代码不得导入 `server` 入口，否则会把 Node.js/数据库依赖带入客户端包。

## 数据库

- Schema：`src/db/schema`
- Drizzle 配置：`drizzle.config.ts`
- 迁移输出：`drizzle/`
- 数据库 URL：由 `@smart-lock/env/server` 从根 `.env` 读取

当前 `drizzle/` 被根 `.gitignore` 排除，干净克隆没有迁移文件。以下 `db:generate` 只适合全新克隆配合空的本地数据库；已有数据库必须先确认迁移历史。

从仓库根目录执行：

```powershell
pnpm env:check
pnpm --filter @smart-lock/env build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## 构建与测试

```powershell
pnpm --filter @smart-lock/env build
pnpm --filter @smart-lock/shared build
pnpm --filter @smart-lock/shared test
```

包级 `lint` 当前会因 ESLint 8 与 TypeScript ESLint 规则版本不兼容而在加载规则时崩溃；在工具链统一前不要把该命令当成可用门禁。

一次性串行运行测试：

```powershell
pnpm --filter @smart-lock/shared exec jest --runInBand
```
