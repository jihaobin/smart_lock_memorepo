# Local Dependencies Docker Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用一条 Docker Compose 命令启动本地开发所需的 PostgreSQL 和 Redis。

**Architecture:** Compose 仅管理基础外部依赖，应用继续运行在宿主机。PostgreSQL 从根目录 `.env` 读取已有变量，两个服务通过命名卷持久化并通过健康检查暴露状态。

**Tech Stack:** Docker Compose、PostgreSQL 16 Alpine、Redis 7 Alpine、pnpm、Drizzle ORM

---

### Task 1: 编排 PostgreSQL 和 Redis

**Files:**

- Create: `docker-compose.yml`

- [x] **Step 1: 新增 Compose 文件**

创建两个服务：`postgres` 使用 `${DATABASE_USER:-postgres}`、`${DATABASE_PASSWORD:-postgres}`、`${DATABASE_NAME:-smart_lock}`，映射 `5432:5432`；`redis` 映射 `6379:6379`。分别挂载 `postgres_data` 和 `redis_data` 命名卷，并使用 `pg_isready` 与 `redis-cli ping` 做健康检查。

- [x] **Step 2: 验证 Compose 可解析**

Run: `docker compose config --quiet`

Expected: 退出码为 0，无配置错误。

- [ ] **Step 3: 启动依赖**

Run: `docker compose up -d`

Expected: `postgres` 和 `redis` 容器被创建并启动。

- [ ] **Step 4: 验证服务健康状态**

Run: `docker compose ps`

Expected: 两个服务均显示 `Up` 和 `healthy`。

### Task 2: 记录本地开发命令

**Files:**

- Modify: `README.md:165`

- [x] **Step 1: 补充基础依赖启动说明**

在环境配置和数据库设置之间新增“启动基础依赖”章节，写明：

```powershell
docker compose up -d
docker compose ps
```

说明 `docker compose down` 保留数据卷，`docker compose down -v` 会删除本地 PostgreSQL 与 Redis 数据。

- [x] **Step 2: 验证文档与实际服务名一致**

Run: `rg -n "docker compose (up|ps|down)" README.md`

Expected: README 包含启动、状态检查、停止和删除卷命令。

### Task 3: 最终验证

**Files:**

- Verify: `docker-compose.yml`
- Verify: `README.md`

- [ ] **Step 1: 验证 PostgreSQL 可接受连接**

Run: `docker compose exec -T postgres sh -c 'pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`

Expected: 输出包含 `accepting connections`。

- [ ] **Step 2: 验证 Redis 响应**

Run: `docker compose exec -T redis redis-cli ping`

Expected: 输出 `PONG`。

- [ ] **Step 3: 检查最终差异**

Run: `git diff -- docker-compose.yml README.md docs/superpowers`

Expected: 只包含本计划范围内的 Compose、README 和设计/计划文档变更，不包含现有工作区其他修改。
