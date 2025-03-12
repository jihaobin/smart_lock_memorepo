#!/bin/bash

# 安装 pnpm（如果尚未安装）
if ! command -v pnpm &> /dev/null; then
    echo "正在安装 pnpm..."
    npm install -g pnpm
fi

# 清理可能的旧缓存或锁文件
echo "清理可能的旧缓存或锁文件..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm -rf packages/*/dist
rm -rf .turbo/turbo-*

# 复制环境变量文件（如果不存在）
if [ ! -f .env ]; then
    echo "创建环境变量文件..."
    cp .env.example .env 2>/dev/null || :
fi

# 安装根目录依赖
echo "正在安装根目录依赖..."
pnpm install

# 构建共享包
echo "正在构建共享包..."
pnpm --filter @smart-lock/shared build

# 安装 API 项目依赖
echo "正在安装 API 项目依赖..."
pnpm --filter @smart-lock/api install

# 安装客户端项目依赖
echo "正在安装客户端项目依赖..."
pnpm --filter @smart-lock/client install

# 运行一次 lint 确保代码质量
echo "正在检查代码质量..."
pnpm lint

echo "安装完成！"
echo "您可以使用以下命令启动开发服务器："
echo "所有项目: pnpm dev"
echo "API: pnpm --filter @smart-lock/api dev"
echo "客户端: pnpm --filter @smart-lock/client start"