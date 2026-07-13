# 本地基础依赖 Docker Compose 设计

## 目标

为本地开发提供一条命令启动项目所需的外部基础依赖。应用本身继续在宿主机通过 pnpm 运行，不纳入容器。

## 服务范围

- PostgreSQL 16 Alpine，对外暴露 `5432` 端口。
- Redis 7 Alpine，对外暴露 `6379` 端口。
- 不包含 API、管理后台、移动端、数据库管理界面或迁移容器。

## 配置与持久化

- PostgreSQL 使用根目录 `.env` 中的 `DATABASE_USER`、`DATABASE_PASSWORD` 和 `DATABASE_NAME`，并提供与 `.env.example` 一致的默认值。
- PostgreSQL 和 Redis 分别使用命名卷保存数据，重建容器不会删除开发数据。
- 镜像使用明确的主版本标签，避免 `latest` 带来的非预期升级。
- 两个服务都配置健康检查，便于判断依赖是否真正可用。

## 开发流程

```powershell
docker compose up -d
pnpm db:migrate
pnpm dev
```

停止容器使用 `docker compose down`。该命令保留命名卷；只有显式执行 `docker compose down -v` 才删除本地依赖数据。

## 验证

- 使用 `docker compose config` 验证 Compose 文件可解析且变量展开正确。
- 使用 `docker compose up -d` 启动服务，并通过 `docker compose ps` 检查健康状态。
- 不自动运行数据库迁移，避免启动依赖时隐式修改数据库结构。
