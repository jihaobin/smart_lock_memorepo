# @smart-lock/admin

智能锁系统的 Web 管理后台。完整架构、启动顺序和当前问题见 [开发与交接指南](../../docs/development-guide.md)。

## 技术与结构

- React 19 + Vite 6
- TanStack Router 文件路由，定义位于 `src/routes`
- TanStack Query 和 `@smart-lock/shared/api`
- Tailwind CSS 4、Radix UI 和 shadcn 风格组件

当前页面包含登录、首页、管理员、用户、设备、设备型号和路由管理。`src/routeTree.gen.ts` 是生成文件，不要手工编辑。

## 启动

```powershell
# 推荐：同时启动 API 和管理端
pnpm dev:admin-api

# 仅启动管理端
pnpm dev:admin
```

组合命令会通过 Turbo 自动构建共享依赖。干净克隆单独运行 `pnpm dev:admin` 前，先执行 `pnpm --filter @smart-lock/env build` 和 `pnpm --filter @smart-lock/shared build`。开发服务器默认地址为 `http://localhost:8080`。

## 命令

```powershell
pnpm --filter @smart-lock/admin dev
pnpm --filter @smart-lock/admin build
pnpm --filter @smart-lock/admin serve
pnpm --filter @smart-lock/admin test
```

当前注意事项：

- `src/lib/aip-service.ts` 把 API 地址固定为 `http://localhost:3000/admin`，尚未支持部署环境配置。
- 当前没有管理端测试文件，`test` 命令会退出 1。
- 当前 `build` 会在 TypeScript 未使用导入/变量检查处失败；详见交接指南的验证基线。
