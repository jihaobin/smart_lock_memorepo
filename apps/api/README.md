# @smart-lock/api

智能锁系统的 NestJS 后端。完整架构、启动顺序和当前问题见 [开发与交接指南](../../docs/development-guide.md)。

## 职责

- 普通用户与管理员认证、全局 JWT 守卫
- 用户、RBAC、设备、设备型号和好友关系
- 临时密码与开锁记录
- 通知、WebSocket、BullMQ 队列和 Redis 缓存
- PostgreSQL/Drizzle 数据访问
- 邮件、阿里云短信和 STS 集成

应用入口为 `src/main.ts`，根模块为 `src/app.module.ts`。Swagger 默认位于 `http://localhost:3000/api-docs`。

## 启动

从仓库根目录启动依赖并校验环境：

```powershell
pnpm env:check
pnpm --filter @smart-lock/env build
pnpm --filter @smart-lock/shared build
docker compose up -d --wait
pnpm db:generate # 仅全新克隆 + 空本地数据库
pnpm db:migrate
pnpm dev:api
```

API 默认监听 `PORT=3000`。本地 `.env` 必须位于仓库根；部署和 CI 也可以直接注入进程环境变量，两者都受 `packages/env/src/definitions/server.ts` 的同一契约校验。

当前迁移目录未被 Git 跟踪，`db:generate` 只适合干净克隆配合空的本地数据库。已有数据库先确认迁移历史，不要直接生成基线。

## 命令

```powershell
pnpm --filter @smart-lock/api dev
pnpm --filter @smart-lock/api build
pnpm --filter @smart-lock/api test
pnpm --filter @smart-lock/api test:cov
```

一次性串行运行 Jest：

```powershell
pnpm --filter @smart-lock/api exec jest --runInBand
```

当前注意事项：

- Redis 连接仍在 `src/app.module.ts` 中固定为 `localhost:6379`。非本机部署前需要先把该配置纳入统一环境契约。
- `main.ts` 的全局前缀排除规则会排除全部路由，普通用户接口当前实际没有 `/api` 前缀。
- `test:e2e` 脚本引用的 `test/jest-e2e.json` 当前不存在，补齐配置和用例前不要把它作为验证门禁。
