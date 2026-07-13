# @smart-lock/env

智能锁 monorepo 的统一环境变量契约。业务应用应从 `@smart-lock/env/client` 或 `@smart-lock/env/server` 读取配置，不要各自直接解析根 `.env`。

## 结构

| 路径                        | 职责                                        |
| --------------------------- | ------------------------------------------- |
| `src/definitions/server.ts` | 服务端、数据库和第三方服务变量定义          |
| `src/definitions/client.ts` | Expo 可公开变量定义                         |
| `src/runtime/server.ts`     | 查找工作区根目录、加载 `.env` 并校验        |
| `src/runtime/client.ts`     | 解析客户端变量，阻止生产 URL 指向 localhost |
| `scripts/init.ts`           | 创建/补全 `.env` 并生成本地值               |
| `scripts/check.ts`          | 校验当前环境或文档/Compose 契约             |
| `scripts/generate.ts`       | 生成 `.env.example` 和根 README 环境表      |

## 命令

从仓库根目录执行：

```powershell
pnpm env:init
pnpm env:check
pnpm env:generate
pnpm env:check -- --contract
```

修改环境变量的正确流程：

1. 更新 `src/definitions/server.ts` 或 `src/definitions/client.ts`。
2. 为解析、默认值或兼容别名补测试。
3. 运行 `pnpm env:generate`。
4. 运行 `pnpm env:check -- --contract`。
5. 检查 `.env.example` 和根 README 的生成差异。

不要手工把密钥加入 `.env.example`，也不要把服务端密钥放入 `EXPO_PUBLIC_*` 变量。

当前已知契约偏差：客户端 API 默认值包含 `/api`，Socket 默认值使用 3000；实际 Nest 路由目前没有 `/api` 前缀，WebSocket Gateway 监听 3001。修复路由和默认值时必须同时更新测试并重新运行生成命令。
