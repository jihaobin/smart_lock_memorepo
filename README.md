# Smart Lock Monorepo

这是一个现代化的智能锁管理系统，采用 monorepo 架构，使用 pnpm 进行包管理，Turborepo 进行任务编排和缓存优化。项目包含移动端客户端、Web管理后台、后端API服务和共享代码库。

## 技术栈概览

- **包管理**: pnpm (v8.15.4+)
- **构建工具**: Turborepo
- **语言**: TypeScript
- **移动端**: React Native + Expo (v52)
- **Web管理端**: React 19 + Vite + TanStack Router
- **后端**: NestJS + PostgreSQL + Drizzle ORM
- **UI组件**: Radix UI + Tailwind CSS (管理端), Gluestack UI (移动端)
- **状态管理**: TanStack Query
- **代码规范**: ESLint + Prettier + Husky

## 详细项目结构

```
smart_lock_memorepo/
├── 📁 apps/                    # 应用程序目录
│   ├── 📱 admin/               # Web管理后台 (React + Vite)
│   │   ├── 📄 package.json     # 管理端依赖配置
│   │   ├── 📄 vite.config.js   # Vite构建配置
│   │   ├── 📄 components.json  # shadcn/ui组件配置
│   │   ├── 📁 src/             # 源代码目录
│   │   │   ├── 📁 components/  # React组件
│   │   │   ├── 📁 hooks/       # 自定义Hooks
│   │   │   ├── 📁 routes/      # 路由配置
│   │   │   ├── 📁 context/     # React Context
│   │   │   └── 📁 lib/         # 工具函数
│   │   └── 📁 public/          # 静态资源
│   ├── 🔧 api/                 # 后端API服务 (NestJS)
│   │   ├── 📄 package.json     # 后端依赖配置
│   │   ├── 📄 nest-cli.json    # NestJS CLI配置
│   │   └── 📁 src/             # 源代码目录
│   │       ├── 📄 main.ts      # 应用入口
│   │       ├── 📄 app.module.ts # 根模块
│   │       ├── 📁 modules/     # 业务模块
│   │       │   ├── 📁 auth/    # 认证模块
│   │       │   ├── 📁 device/  # 设备管理模块
│   │       │   ├── 📁 admin/   # 管理员模块
│   │       │   └── 📁 friend/  # 好友管理模块
│   │       ├── 📁 common/      # 通用功能
│   │       ├── 📁 config/      # 配置模块
│   │       └── 📁 database/    # 数据库配置
│   └── 📱 client/              # 移动端客户端 (React Native + Expo)
│       ├── 📄 package.json     # 移动端依赖配置
│       ├── 📄 app.json         # Expo应用配置
│       ├── 📄 metro.config.js  # Metro打包配置
│       ├── 📁 app/             # 应用页面 (Expo Router)
│       │   ├── 📁 (tabs)/      # 底部导航页面
│       │   ├── 📁 login/       # 登录页面
│       │   ├── 📁 device-*/    # 设备相关页面
│       │   └── 📁 user-*/      # 用户相关页面
│       ├── 📁 components/      # React Native组件
│       ├── 📁 hooks/           # 自定义Hooks
│       ├── 📁 services/        # API服务
│       ├── 📁 contexts/        # React Context
│       └── 📁 utils/           # 工具函数
├── 📦 packages/                # 共享包目录
│   └── 📚 shared/              # 共享代码库
│       ├── 📄 package.json     # 共享包配置
│       ├── 📄 drizzle.config.ts # 数据库配置
│       ├── 📄 tsup.config.ts   # 构建配置
│       └── 📁 src/             # 源代码目录
│           ├── 📁 api/         # API客户端
│           ├── 📁 db/          # 数据库模型和迁移
│           ├── 📁 shared/      # 共享类型和工具
│           ├── 📁 client/      # 客户端专用代码
│           └── 📁 server/      # 服务端专用代码
├── 🔧 配置文件
│   ├── 📄 package.json         # 根项目配置和脚本
│   ├── 📄 pnpm-workspace.yaml  # pnpm工作空间配置
│   ├── 📄 turbo.json           # Turborepo任务配置
│   ├── 📄 tsconfig.json        # TypeScript基础配置
│   ├── 📄 .eslintrc.js         # ESLint代码规范配置
│   ├── 📄 .prettierrc          # Prettier代码格式化配置
│   ├── 📄 commitlint.config.js # Git提交信息规范
│   └── 📄 .env.example         # 环境变量模板
├── 🔒 开发工具
│   ├── 📁 .husky/              # Git hooks配置
│   ├── 📁 .vscode/             # VS Code配置
│   └── 📁 .trae/               # Trae AI配置
└── 📄 install.ps1/sh           # 自动化安装脚本
```

## 核心功能模块

### 📱 移动端客户端 (apps/client)

- **用户认证**: 登录、注册、忘记密码
- **设备管理**: 添加设备、设备详情、设备设置
- **远程开锁**: 蓝牙连接、远程控制
- **临时密码**: 生成、管理临时访问密码
- **访问记录**: 查看开锁历史记录
- **好友管理**: 邀请好友、权限管理
- **通知中心**: 实时消息推送

### 🖥️ Web管理后台 (apps/admin)

- **用户管理**: 用户列表、权限控制、数据统计
- **设备监控**: 设备状态、在线监控、批量管理
- **数据分析**: 使用统计、图表展示、报表生成
- **系统配置**: 参数设置、角色管理、权限分配

### 🔧 后端API服务 (apps/api)

- **RESTful API**: 标准化接口设计
- **WebSocket**: 实时通信支持
- **认证授权**: JWT令牌、角色权限控制
- **数据库操作**: Drizzle ORM、事务管理
- **文件上传**: 多媒体文件处理
- **消息推送**: 实时通知服务
- **任务队列**: BullMQ异步任务处理
- **缓存机制**: Redis缓存优化

### 📚 共享代码库 (packages/shared)

- **类型定义**: TypeScript类型声明
- **数据库模型**: Drizzle ORM Schema
- **API客户端**: 统一的API调用封装
- **工具函数**: 通用业务逻辑
- **常量定义**: 全局常量和配置
- **验证规则**: Zod数据验证

## 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.15.4
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0
- **Android Studio**: 用于Android开发
- **Xcode**: 用于iOS开发 (仅macOS)

## 快速开始

### 1. 安装依赖

#### Windows

```powershell
# 使用 PowerShell 安装
.\install.ps1
```

#### Linux/macOS

```bash
# 使用 Bash 安装
chmod +x ./install.sh
./install.sh
```

#### 手动安装

```bash
# 安装 pnpm (如果未安装)
npm install -g pnpm

# 安装项目依赖
pnpm install
```

### 2. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量文件
# 配置数据库连接、JWT密钥等
```

### 3. 数据库设置

```bash
# 生成数据库迁移文件
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# 打开数据库管理界面 (可选)
pnpm db:studio
```

## 开发工作流

### 启动开发服务器

```bash
# 🚀 启动所有服务 (推荐用于全栈开发)
pnpm dev

# 🎯 按需启动特定服务组合
pnpm dev:client-api    # 移动端 + API
pnpm dev:admin-api     # 管理端 + API
pnpm dev:all           # 全部服务

# 📱 单独启动移动端
pnpm dev:client
# 访问: Expo开发服务器会自动打开

# 🖥️ 单独启动管理后台
pnpm dev:admin
# 访问: http://localhost:8080

# 🔧 单独启动API服务
pnpm dev:api
# 访问: http://localhost:3000
```

### 开发端口分配

| 服务       | 端口 | 访问地址              | 说明             |
| ---------- | ---- | --------------------- | ---------------- |
| API服务    | 3000 | http://localhost:3000 | 后端API接口      |
| 管理后台   | 8080 | http://localhost:8080 | Web管理界面      |
| 移动端     | 动态 | Expo DevTools         | React Native应用 |
| 数据库管理 | 动态 | Drizzle Studio        | 数据库可视化工具 |

### 移动端开发

```bash
# 📱 启动移动端开发服务器
pnpm start:client

# 🤖 在Android设备/模拟器上运行
pnpm android

# 🍎 在iOS设备/模拟器上运行 (仅macOS)
pnpm ios

# 🌐 在Web浏览器中运行 (用于快速调试)
pnpm --filter @smart-lock/client web

# 🔄 清除缓存并重启
pnpm --filter @smart-lock/client clean-cache
```

### 数据库开发

```bash
# 📊 打开数据库管理界面
pnpm db:studio

# 🔄 生成新的迁移文件 (修改schema后)
pnpm db:generate

# ⬆️ 执行数据库迁移
pnpm db:migrate

# 🚀 生成并立即执行迁移 (常用)
pnpm db:generate:migrate
```

## 构建和部署

### 开发构建

```bash
# 🏗️ 构建所有项目
pnpm build

# 🎯 单独构建特定项目
pnpm --filter @smart-lock/admin build    # 管理后台
pnpm --filter @smart-lock/api build      # API服务
pnpm --filter @smart-lock/shared build   # 共享包
```

### 移动端构建

```bash
# 📱 预构建 (生成原生代码)
pnpm prebuild

# 🤖 构建Android应用
pnpm build:android
# 输出: android/app/build/outputs/apk/

# 🍎 构建iOS应用 (仅macOS)
pnpm build:ios
# 输出: ios/build/

# 🧹 清理原生代码 (重新预构建前)
pnpm --filter @smart-lock/client clean
```

### 生产部署

```bash
# 🚀 启动生产服务器
pnpm start

# 🎯 单独启动生产服务
pnpm start:api      # API服务
pnpm start:client   # 移动端 (Expo)
```

## 代码质量保证

### 代码规范检查

本项目使用 ESLint + Prettier + Husky 确保代码质量：

```bash
# 🔍 检查所有代码规范
pnpm lint

# 🔧 自动修复代码规范问题
pnpm lint:fix

# 🎯 检查特定应用
pnpm lint:api       # 检查API代码
pnpm lint:client    # 检查移动端代码

# 🔧 修复特定应用
pnpm lint:api:fix   # 修复API代码
pnpm lint:client:fix # 修复移动端代码

# 💅 格式化所有代码
pnpm format
```

### Git提交规范

项目使用 commitlint 确保提交信息规范：

```bash
# ✅ 正确的提交格式
git commit -m "feat(client): 添加设备管理页面"
git commit -m "fix(api): 修复用户认证bug"
git commit -m "docs: 更新README文档"

# ❌ 错误的提交格式
git commit -m "修改了一些东西"  # 缺少类型和范围
```

**提交类型说明：**

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建配置
- `ci`: CI/CD配置
- `chore`: 其他杂项

### 自动化检查

项目配置了 Git hooks，在提交时自动执行：

- **pre-commit**: 代码格式检查和修复
- **commit-msg**: 提交信息格式验证

## 测试

```bash
# 🧪 运行所有测试
pnpm test

# 🎯 运行特定应用测试
pnpm --filter @smart-lock/api test
pnpm --filter @smart-lock/client test

# 👀 监听模式运行测试
pnpm --filter @smart-lock/client test:watch
```

## 项目架构设计

### 技术选型理由

- **Monorepo**: 统一管理多个相关项目，共享代码和配置
- **pnpm**: 更快的安装速度，更少的磁盘占用
- **Turborepo**: 智能缓存和并行构建，提升开发效率
- **TypeScript**: 类型安全，更好的开发体验
- **Drizzle ORM**: 类型安全的数据库操作，优秀的性能
- **TanStack Query**: 强大的数据获取和缓存管理
- **Expo**: 快速的React Native开发和部署

### 数据流架构

```
📱 移动端客户端 ←→ 🔧 API服务 ←→ 🗄️ PostgreSQL数据库
     ↓                    ↓              ↓
🖥️ Web管理后台 ←→ 📚 共享代码库 ←→ 💾 Redis缓存
```

### 目录命名规范

- **apps/**: 应用程序 (可独立部署的项目)
- **packages/**: 共享包 (被其他项目依赖的代码)
- **src/**: 源代码目录
- **components/**: React组件
- **hooks/**: 自定义Hooks
- **utils/**: 工具函数
- **types/**: 类型定义
- **services/**: API服务层

## 开发指南

### 新人上手步骤

1. **环境准备**: 安装Node.js、pnpm、数据库
2. **项目克隆**: `git clone` 并 `pnpm install`
3. **环境配置**: 复制 `.env.example` 到 `.env`
4. **数据库初始化**: `pnpm db:generate:migrate`
5. **启动开发**: `pnpm dev`
6. **熟悉代码**: 从 `packages/shared` 开始了解类型定义

### 开发最佳实践

- **类型优先**: 先定义类型，再实现功能
- **组件复用**: 优先使用共享组件库
- **API统一**: 通过shared包统一API调用
- **错误处理**: 使用统一的错误处理机制
- **性能优化**: 合理使用缓存和懒加载

### 添加新功能流程

1. **类型定义**: 在 `packages/shared/src/shared/types/` 添加类型
2. **数据库模型**: 在 `packages/shared/src/db/schema/` 更新schema
3. **API接口**: 在 `apps/api/src/modules/` 实现后端逻辑
4. **前端实现**: 在对应的app中实现UI和业务逻辑
5. **测试验证**: 编写测试用例确保功能正常

## 清理和维护

### 清理命令

```bash
# 🧹 清理所有构建文件和依赖
pnpm clean

# 🗑️ 清理特定项目
pnpm --filter @smart-lock/client clean
pnpm --filter @smart-lock/api clean

# 💨 清理Turborepo缓存
rm -rf .turbo

# 🔄 完全重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Turborepo缓存管理

项目使用Turborepo进行智能缓存，显著提升构建速度：

```bash
# 📊 查看缓存统计
pnpm turbo run build --summarize

# 🗑️ 清除特定任务缓存
pnpm turbo run build --force

# 💾 缓存存储位置
# .turbo/cache/ - 本地缓存
```

## 环境变量配置

### 配置文件说明

```bash
pnpm env:init
pnpm env:check
pnpm env:generate --check
```

### 关键环境变量

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

## 常见问题解答

### Q: 如何添加新的数据库表？

A:

1. 在 `packages/shared/src/db/schema/schema.ts` 中定义新表
2. 运行 `pnpm db:generate` 生成迁移文件
3. 运行 `pnpm db:migrate` 执行迁移
4. 在 `packages/shared/src/shared/types/` 中添加对应的TypeScript类型

### Q: 如何在移动端和Web端之间共享组件？

A: 将通用组件放在 `packages/shared/src/` 中，使用条件导入处理平台差异。

### Q: 如何调试API接口？

A:

1. 启动API服务：`pnpm dev:api`
2. 访问Swagger文档：`http://localhost:3000/api/docs`
3. 使用Postman或类似工具测试接口

### Q: 移动端如何连接到本地API？

A:

1. 确保手机和电脑在同一网络
2. 将 `EXPO_PUBLIC_API_URL` 设置为电脑的IP地址
3. 例如：`http://192.168.1.100:3000/api`

### Q: 如何更新依赖包？

A:

```bash
# 检查过时的包
pnpm outdated

# 更新所有包到最新版本
pnpm update

# 更新特定包
pnpm update package-name
```

## 故障排除

### 🚨 常见问题快速解决

#### 1. 依赖安装问题

```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 如果仍有问题，清理pnpm缓存
pnpm store prune
pnpm install
```

#### 2. 构建失败

```bash
# 清理所有缓存
pnpm clean
rm -rf .turbo
pnpm install
pnpm build
```

#### 3. 移动端开发问题

```bash
# 清理Expo缓存
cd apps/client
npx expo install --fix
npx expo start --clear

# 重置Metro缓存
npx react-native start --reset-cache
```

#### 4. 数据库连接问题

```bash
# 检查数据库是否运行
psql -h localhost -p 5432 -U postgres -d smart_lock

# 重新生成数据库
pnpm db:generate:migrate
```

#### 5. 端口占用问题

```bash
# Windows查看端口占用
netstat -ano | findstr :3000

# 杀死占用进程
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill -9
```

### 🔧 深度故障排除

#### TypeScript类型错误

```bash
# 重新生成类型定义
cd packages/shared
pnpm build

# 检查类型
pnpm type-check
```

#### 环境变量问题

```bash
# 检查环境变量是否正确加载
node -e "console.log(process.env.DATABASE_URL)"

# 复制环境变量模板
cp .env.example .env
```

#### 网络连接问题

```bash
# 测试API连接
curl http://localhost:3000/api/health

# 检查防火墙设置
# Windows: 允许Node.js通过防火墙
# 确保3000、8081端口未被阻止
```

#### 性能问题

```bash
# 分析包大小
cd apps/admin
npx vite-bundle-analyzer

# 检查内存使用
node --max-old-space-size=4096 node_modules/.bin/vite build
```

### Metro Bundler 问题

#### 问题：模块解析失败

**错误信息示例：**

```bash
Error: Unable to resolve module ./../../node_modules/expo-router/entry.js from C:\Users\admin\Desktop\smart_lock_memorepo/.
```

**解决方案：**

1. **检查 Metro 配置** (`apps/client/metro.config.js`)：

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// 获取 monorepo 根目录
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 配置 watchFolders 以包含 monorepo 根目录
config.watchFolders = [monorepoRoot];

// 配置模块解析路径
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 配置 disableHierarchicalLookup
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
```

1. **设置环境变量**：

```bash
# 在构建前设置
$env:EXPO_NO_METRO_WORKSPACE_ROOT = 1
# 或在 Linux/macOS
export EXPO_NO_METRO_WORKSPACE_ROOT = 1

# 禁用expo的workspace自动查找目录
```

### react-native-reanimated依赖构建问题

请阅读这个[文档](https://docs.swmansion.com/react-native-reanimated/docs/guides/building-on-windows/#requirements)中的排查步骤进行尝试

### Android 构建问题

#### 问题：CMake 版本不匹配

**错误信息示例：**

```bash
C/C++: ninja: error: mkdir(...): No such file or directory
```

**解决方案：**

1. **通过 Android Studio 更新 CMake**：
   - 打开 Android Studio
   - 进入 Tools → SDK Manager → SDK Tools
   - 勾选 CMake 并选择最新版本(确保使用 CMake 3.22.1 或更高版本)
   - 应用更改
   - 设置环境变量

```bash
$env:CMAKE_VERSION = 'CMake Version'
```

2. **在 build.gradle 中指定 CMake 版本**：

```gradle
android {
    externalNativeBuild {
        cmake {
            version "3.24.0"  // 或更新版本
        }
    }
}
```

3. **启用 Windows 长路径支持**：

**方法1：通过组策略**

- 按 `Win + R`，输入 `gpedit.msc`
- 导航到：计算机配置 → 管理模板 → 系统 → 文件系统
- 启用 "启用Win32长路径"

**方法2：通过注册表**

- 按 `Win + R`，输入 `regedit`
- 导航到：`HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\FileSystem`
- 将 `LongPathsEnabled` 设置为 `1`

4. **临时解决方案**：
   将项目移动到更短的路径，如 `C:\smart_lock\`

### 常见问题检查清单

在遇到构建问题时，按以下顺序检查：

1. ✅ 清理所有缓存（见通用缓存清理章节）
2. ✅ 检查 Metro 配置是否正确
3. ✅ 确认 Android SDK CMake 版本
4. ✅ 验证 Windows 长路径支持
5. ✅ 检查 Android 签名配置
6. ✅ 确认 Node.js 版本兼容性
7. ✅ 检查项目路径长度
8. ✅ 验证环境变量设置
