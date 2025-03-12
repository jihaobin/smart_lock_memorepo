# 安装 pnpm（如果尚未安装）
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "正在安装 pnpm..."
    npm install -g pnpm
}

# 清理可能的旧缓存或锁文件
Write-Host "清理可能的旧缓存或锁文件..."
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "apps/*/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages/*/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "packages/*/dist" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".turbo/turbo-*" -Recurse -Force -ErrorAction SilentlyContinue

# 复制环境变量文件（如果不存在）
if (-not (Test-Path ".env")) {
    Write-Host "创建环境变量文件..."
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
}

# 安装根目录依赖
Write-Host "正在安装根目录依赖..."
pnpm install

# 构建共享包
Write-Host "正在构建共享包..."
pnpm --filter @smart-lock/shared build

# 安装 API 项目依赖
Write-Host "正在安装 API 项目依赖..."
pnpm --filter @smart-lock/api install

# 安装客户端项目依赖
Write-Host "正在安装客户端项目依赖..."
pnpm --filter @smart-lock/client install

# 运行一次 lint 确保代码质量
Write-Host "正在检查代码质量..."
pnpm lint

Write-Host "安装完成！"
Write-Host "您可以使用以下命令启动开发服务器："
Write-Host "所有项目: pnpm dev"
Write-Host "API: pnpm --filter @smart-lock/api dev"
Write-Host "客户端: pnpm --filter @smart-lock/client start"