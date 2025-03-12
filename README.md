# Smart Lock Monorepo

这是一个使用 pnpm 管理的 monorepo 项目，包含智能锁系统的前端、后端和共享代码。项目使用 Turborepo 进行任务编排和缓存优化。

## 项目结构

```
smart_lock_memorepo/
├── apps/
│   ├── client/         # React Native Expo 客户端应用（已迁移自new_lock）
│   └── api/            # NestJS 后端 API
├── packages/
│   └── shared/         # 共享代码、类型和工具函数
├── package.json        # 根项目配置
├── pnpm-workspace.yaml # pnpm 工作空间配置
├── turbo.json          # Turborepo 配置
└── tsconfig.json       # 共享 TypeScript 配置
```

## 安装依赖

### Windows

```bash
# 使用 PowerShell 安装
.\install.ps1
```

### Linux/macOS

```bash
# 使用 Bash 安装
chmod +x ./install.sh
./install.sh
```

## 开发

```bash
# 启动所有项目的开发服务器
pnpm dev

# 或者单独启动某个项目
pnpm --filter @smart-lock/client start
pnpm --filter @smart-lock/api dev
```

## 构建

```bash
# 构建所有项目
pnpm build

# 或者单独构建某个项目
pnpm --filter @smart-lock/client build
pnpm --filter @smart-lock/api build
```

## 移动端构建

```bash
# 构建 Android 应用
pnpm build:android

# 构建 iOS 应用
pnpm build:ios

# 预构建（生成原生代码）
pnpm prebuild
```

## 代码规范

本项目使用 ESLint 和 Prettier 进行代码规范检查和格式化，使用 Husky 和 lint-staged 在提交前进行检查。

```bash
# 运行代码规范检查
pnpm lint

# 修复代码规范问题
pnpm lint:fix

# 格式化代码
pnpm format
```

## 测试

```bash
# 运行所有测试
pnpm test
```

## 清理

```bash
# 清理所有项目的构建文件和依赖
pnpm clean
```

## Turborepo 缓存

项目使用 Turborepo 进行任务编排和缓存优化，以加速构建和开发流程。缓存存储在 `.turbo` 目录中。

```bash
# 清除 Turborepo 缓存
rm -rf .turbo/turbo-*
```

## 环境变量

项目使用 `.env` 文件存储环境变量，你可以复制 `.env.example` 文件并重命名为 `.env`，然后根据需要修改其中的值。

## Git 提交规范

本项目使用 commitlint 进行提交信息规范检查，请按照以下格式提交代码：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）可以是：

- feat: 新功能
- fix: 修复 Bug
- docs: 文档变更
- style: 代码风格变更（不影响功能）
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- build: 构建系统或外部依赖变更
- ci: CI 配置变更
- chore: 其他变更

例如：

```
feat(client): 添加用户登录页面
```

## 项目迁移说明

已经完成了以下迁移工作：

1. 将 new_lock 项目的代码迁移到 apps/client 目录
2. 修改了 client 项目的 package.json，名称改为 @smart-lock/client
3. 更新了 client 项目的 tsconfig.json，使其继承根目录的 tsconfig.json
4. 添加了 client 对 shared 包的依赖
5. 配置了 Turborepo 以优化构建和开发流程

当前项目状态：

- client 项目可以正常使用共享包中的类型和工具函数
- API 项目可以正常使用共享包中的类型和工具函数
- 共享包包含基本的类型定义、工具函数和数据库模型
- Turborepo 配置已优化，支持多种任务和缓存