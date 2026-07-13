# @smart-lock/client

智能锁系统的 Expo/React Native 移动端。完整架构、启动顺序和当前问题见 [开发与交接指南](../../docs/development-guide.md)。

## 技术与结构

- Expo 52、React Native 0.76、Expo Router
- `app/`：文件路由页面
- `components/`：业务组件与 Gluestack UI 封装
- `contexts/`：认证、API、通知和设备管理上下文
- `hooks/`：查询、Socket 和业务状态 Hook
- `lib/bluetooth.ts`：蓝牙能力

蓝牙和 Wi-Fi 配网依赖原生模块。Expo Go 不能覆盖完整功能，优先使用开发构建、Android 真机或模拟器。

## 启动

```powershell
# 推荐：同时启动 API 和移动端
pnpm dev:client-api

# 仅启动移动端
pnpm dev:client
```

组合命令会通过 Turbo 自动构建共享依赖。干净克隆单独运行 `pnpm dev:client` 前，先执行 `pnpm --filter @smart-lock/env build` 和 `pnpm --filter @smart-lock/shared build`。

当前移动端脚本使用 Windows `set` 语法。macOS/Linux 接手者需要先将脚本迁移到 `cross-env` 或等价的跨平台启动方式。

## 环境变量

移动端只读取：

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SOCKET_URL=http://localhost:3001
```

这是当前运行时的临时绕行值：Nest 全局前缀配置实际排除了所有路由，所以 API 暂时没有 `/api` 前缀；三个 WebSocket Gateway 都监听 3001。`@smart-lock/env` 当前生成的 `/api` 和 3000 默认值与运行时不一致。

真机调试必须把 `localhost` 替换为开发机局域网 IP，并允许防火墙上的 3000、3001 端口。变量由 `config/env.ts` 经 `@smart-lock/env/client` 校验；生产构建不允许指向 localhost。

## 命令

```powershell
pnpm --filter @smart-lock/client dev
pnpm --filter @smart-lock/client android
pnpm --filter @smart-lock/client ios
pnpm --filter @smart-lock/client web
pnpm --filter @smart-lock/client prebuild
pnpm --filter @smart-lock/client clean
```

一次性运行测试：

```powershell
pnpm --filter @smart-lock/client exec jest --runInBand --watch=false
```

`clean` 会删除 `apps/client/android` 和 `apps/client/ios`，运行前确认没有未提交的原生修改。
