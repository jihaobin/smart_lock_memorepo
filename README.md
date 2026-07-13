# Smart Lock Monorepo

智能锁系统的 pnpm + Turborepo 工作区。仓库包含 NestJS API、React 管理后台、Expo 移动端，以及统一的共享代码和环境配置包。

> 项目仍处于开发阶段。首次接手前请先阅读 [开发与交接指南](docs/development-guide.md)，尤其是其中的“当前已知问题”和“验证基线”。

## 工作区

| 工作区               | 路径              | 主要职责                                        | 技术栈                          |
| -------------------- | ----------------- | ----------------------------------------------- | ------------------------------- |
| `@smart-lock/api`    | `apps/api`        | REST API、WebSocket、认证、设备、通知和后台接口 | NestJS 11、BullMQ               |
| `@smart-lock/admin`  | `apps/admin`      | 管理员登录、用户、设备、型号、路由和角色管理    | React 19、Vite、TanStack Router |
| `@smart-lock/client` | `apps/client`     | 智能锁移动端、蓝牙配网、远程开锁和通知          | Expo 52、React Native 0.76      |
| `@smart-lock/shared` | `packages/shared` | 数据库 Schema、API 客户端、共享类型与平台适配器 | Drizzle ORM、Axios、Zod         |
| `@smart-lock/env`    | `packages/env`    | 环境变量定义、解析、生成和契约检查              | Zod、dotenv、tsup               |

## 环境要求

- Node.js `>= 18`。当前验证环境为 Node.js `22.18.0`。
- pnpm `8.15.4`，版本以根 `package.json` 的 `packageManager` 字段为准。
- Docker Desktop 或兼容的 Docker Compose，用于 PostgreSQL 17 和 Redis 7。
- 移动端开发还需要 Android Studio、Android 真机或模拟器；iOS 原生构建只能在 macOS 上进行。

## 首次启动

在仓库根目录执行：

```powershell
pnpm install
pnpm env:init
```

`pnpm env:init` 会创建或补全根目录 `.env`，并为本地数据库密码、JWT 等字段生成值。邮件、阿里云和超级管理员字段不会自动补齐；这些必填项为空时命令退出码为 1，这是预期的提醒。填写后运行：

```powershell
pnpm env:check
pnpm --filter @smart-lock/env build
pnpm --filter @smart-lock/shared build
docker compose up -d --wait
docker compose ps
pnpm db:generate
pnpm db:migrate
```

上面的 `db:generate` 只适用于全新克隆配合空的本地数据库卷：当前迁移目录被 Git 忽略，干净克隆没有可直接执行的迁移。已有数据库或共享环境不要盲目生成基线，先阅读交接指南中的数据库说明。

然后按开发目标启动应用：

```powershell
# API + 管理后台
pnpm dev:admin-api

# API + 移动端
pnpm dev:client-api

# 三个应用一起启动
pnpm dev:all
```

也可以单独运行，但单应用脚本不会自动构建 `@smart-lock/env` 和 `@smart-lock/shared`；干净克隆必须先执行上面的两个共享包构建命令：

```powershell
pnpm dev:api
pnpm dev:admin
pnpm dev:client
```

## 本地地址

| 服务       | 默认地址                         |
| ---------- | -------------------------------- |
| API        | `http://localhost:3000`          |
| Socket     | `http://localhost:3001`          |
| Swagger    | `http://localhost:3000/api-docs` |
| 管理后台   | `http://localhost:8080`          |
| PostgreSQL | `localhost:5432`                 |
| Redis      | `localhost:6379`                 |
| Expo       | 由 Expo CLI 输出实际地址和二维码 |

移动端在真机上调试时，`localhost` 指向手机自身。当前 API 的全局前缀配置会排除全部路由，因此代码生成的 `/api` 默认值与运行时不一致；修复前请把 `EXPO_PUBLIC_API_URL` 临时设为 `http://192.168.1.10:3000`，把 `EXPO_PUBLIC_SOCKET_URL` 设为实际 Gateway 端口 `http://192.168.1.10:3001`，并确保防火墙允许 3000、3001 端口。

## 常用命令

| 命令                           | 作用                                                  |
| ------------------------------ | ----------------------------------------------------- |
| `pnpm env:init`                | 创建或补全 `.env`，生成可自动生成的本地值             |
| `pnpm env:check`               | 校验当前 `.env` 是否满足服务端环境契约                |
| `pnpm env:check -- --contract` | 检查 Compose、`.env.example` 和本文环境变量表是否同步 |
| `pnpm env:generate`            | 从 `packages/env` 定义重新生成 `.env.example` 和下表  |
| `pnpm db:generate`             | 根据 Drizzle Schema 生成迁移文件                      |
| `pnpm db:migrate`              | 执行未应用的数据库迁移                                |
| `pnpm db:studio`               | 启动 Drizzle Studio                                   |
| `pnpm build`                   | 构建全部工作区；移动端当前只输出占位信息              |
| `pnpm test`                    | 通过 Turbo 运行各工作区测试；移动端会进入 watch       |
| `pnpm lint`                    | 运行根 ESLint 配置；当前基线失败，详见交接指南        |
| `pnpm format`                  | 格式化 TypeScript、TSX 和 Markdown 文件               |

## 环境变量

环境变量的唯一代码事实来源是 `packages/env/src/definitions/`。不要手工维护 `.env.example` 或下表；修改定义后运行 `pnpm env:generate`。

> 当前生成值中，`EXPO_PUBLIC_API_URL` 的 `/api` 前缀和 `EXPO_PUBLIC_SOCKET_URL` 的 3000 端口与实际运行时不一致。修复代码契约前，使用上文真机说明中的无前缀 API 地址和 3001 Socket 地址。

<!-- ENV_TABLE_START -->

| 变量名                         | 作用域     | 必填 | 默认值                    | 说明                     |
| ------------------------------ | ---------- | ---- | ------------------------- | ------------------------ |
| `NODE_ENV`                     | 服务端     | 是   | development               | 运行环境                 |
| `PORT`                         | 服务端     | 是   | 3000                      | API 端口                 |
| `NEXT_PUBLIC_APP_URL`          | 服务端     | 否   | -                         | 允许跨域访问的客户端 URL |
| `DEBUG_KEY`                    | 服务端     | 是   | -                         | 调试接口密钥             |
| `JWT_SECRET`                   | 服务端     | 是   | -                         | JWT 签名密钥             |
| `JWT_EXPIRES_IN`               | 服务端     | 是   | 1d                        | JWT 有效期               |
| `SUPER_ADMIN_USERNAME`         | 服务端     | 是   | -                         | 超级管理员用户名         |
| `SUPER_ADMIN_PASSWORD`         | 服务端     | 是   | -                         | 超级管理员密码           |
| `DATABASE_USER`                | 数据库     | 是   | postgres                  | 数据库用户名             |
| `DATABASE_PASSWORD`            | 数据库     | 是   | -                         | 数据库密码               |
| `DATABASE_NAME`                | 数据库     | 是   | smart_lock                | 数据库名称               |
| `DATABASE_URL`                 | 数据库     | 是   | -                         | PostgreSQL 连接 URL      |
| `EXPO_PUBLIC_API_URL`          | 客户端公开 | 是   | http://localhost:3000/api | Expo API URL             |
| `EXPO_PUBLIC_SOCKET_URL`       | 客户端公开 | 是   | http://localhost:3000     | Expo Socket URL          |
| `MAIL_HOST`                    | 第三方服务 | 是   | -                         | 邮件服务器主机           |
| `MAIL_PORT`                    | 第三方服务 | 是   | -                         | 邮件服务器端口           |
| `MAIL_USER`                    | 第三方服务 | 是   | -                         | 邮件服务用户名           |
| `MAIL_PASS`                    | 第三方服务 | 是   | -                         | 邮件服务密码             |
| `MAIL_FROM_NAME`               | 第三方服务 | 是   | -                         | 邮件发件人名称           |
| `ALIYUN_ACCESS_KEY_ID`         | 第三方服务 | 是   | -                         | 阿里云 AccessKey ID      |
| `ALIYUN_ACCESS_KEY_SECRET`     | 第三方服务 | 是   | -                         | 阿里云 AccessKey Secret  |
| `ALIYUN_SMS_SIGN_NAME`         | 第三方服务 | 是   | -                         | 阿里云短信签名           |
| `ALIYUN_SMS_TEMPLATE_CODE`     | 第三方服务 | 是   | -                         | 阿里云短信模板代码       |
| `ALIYUN_STS_ROLE_ARN`          | 第三方服务 | 是   | -                         | 阿里云 STS 角色 ARN      |
| `ALIYUN_STS_ROLE_SESSION_NAME` | 第三方服务 | 是   | SmartLockApp              | 阿里云 STS 会话名称      |
| `ALIYUN_STS_POLICY`            | 第三方服务 | 否   |                           | 阿里云 STS 策略          |
| `ALIYUN_STS_DURATION_SECONDS`  | 第三方服务 | 是   | 3600                      | 阿里云 STS 有效秒数      |

<!-- ENV_TABLE_END -->

## 文档

- [开发与交接指南](docs/development-guide.md)：架构、数据流、启动流程、测试基线和当前问题。
- [API 说明](apps/api/README.md)
- [管理后台说明](apps/admin/README.md)
- [移动端说明](apps/client/README.md)
- [共享包说明](packages/shared/README.md)
- [环境配置包说明](packages/env/README.md)

文档如与代码冲突，按以下优先级判断当前行为：运行结果与测试、工作区 `package.json` 脚本、`packages/env` 环境定义、应用入口与模块装配、最后才是说明文档。发现偏差时应在同一变更中同步文档。
