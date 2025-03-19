# 通用缓存服务模块

本模块提供了统一的缓存抽象层，支持内存缓存和IoRedis缓存，并提供了平滑迁移路径。

## 特性

- 统一的缓存接口抽象
- 支持多种缓存实现（内存、IoRedis）
- 支持Redis高级数据结构（哈希、列表、集合、有序集合等）
- 支持分布式锁和发布/订阅功能
- 松耦合设计，便于替换底层实现

## 安装依赖

### 基本依赖（内存缓存）

```bash
npm install @nestjs/cache-manager cache-manager
```

### IoRedis缓存依赖（直接使用ioredis）

```bash
npm install ioredis uuid
```

## 使用指南

### 1. 在AppModule中导入缓存模块

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheType } from './modules/cache';

@Module({
  imports: [
    // 使用内存缓存（默认配置）
    CacheModule.register(),

    // 或自定义配置
    // CacheModule.registerAsync({
    //   type: CacheType.MEMORY,
    //   ttl: 600, // 缓存10分钟
    //   max: 200, // 最多缓存200项
    // }),

    // 或使用IoRedis缓存
    // CacheModule.registerAsync({
    //   type: CacheType.IOREDIS,
    //   redisOptions: {
    //     host: 'localhost',
    //     port: 6379,
    //     password: 'password',
    //     db: 0,
    //     enablePubSub: true, // 如需使用发布/订阅功能
    //   },
    // }),
  ],
})
export class AppModule {}
```

### 2. 在服务中注入并使用缓存

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_SERVICE, ICacheService } from './modules/cache';

@Injectable()
export class ExampleService {
  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
  ) {}

  async getData(id: string): Promise<any> {
    // 尝试从缓存获取数据
    const cacheKey = `data:${id}`;
    const cachedData = await this.cacheService.get<any>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    // 模拟从数据库获取数据
    const data = { id, name: '示例数据', timestamp: Date.now() };

    // 缓存数据，有效期5分钟
    await this.cacheService.set(cacheKey, data, 300);

    return data;
  }
}
```

### 3. 使用装饰器简化缓存操作

```typescript
import { Injectable } from '@nestjs/common';
import { Cacheable, InjectCacheService } from './modules/cache';

@Injectable()
export class UserService {
  @InjectCacheService() // 注入缓存服务
  private readonly cacheService: ICacheService;

  @Cacheable({ ttl: 300 }) // 缓存5分钟
  async getUserById(id: string): Promise<any> {
    // 模拟数据库查询
    console.log(`从数据库获取用户: ${id}`);
    return { id, name: '用户' + id, lastLogin: new Date() };
  }
}
```

## 从内存缓存迁移到IoRedis

当系统负载增加，需要使用更高性能的Redis缓存，或需要使用Redis的高级功能时，可以平滑迁移到IoRedis实现。

### 迁移步骤

1. 安装依赖

```bash
npm install ioredis uuid
```

2. 更新缓存模块配置

```typescript
import { Module } from '@nestjs/common';
import { CacheModule, CacheType } from './modules/cache';

@Module({
  imports: [
    CacheModule.registerAsync({
      type: CacheType.IOREDIS,
      redisOptions: {
        host: 'localhost',
        port: 6379,
        password: 'password',
        db: 0,
        // 如果需要使用发布/订阅功能
        enablePubSub: true,
      },
    }),
  ],
})
export class AppModule {}
```

3. 使用高级缓存功能（可选）

如果需要使用Redis的高级功能，可以注入IAdvancedCacheService:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_SERVICE, IAdvancedCacheService } from './modules/cache';
import { Redis } from 'ioredis';

@Injectable()
export class AdvancedService {
  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: IAdvancedCacheService,
  ) {}

  async addUserToGroup(userId: string, groupId: string): Promise<void> {
    // 使用Redis集合添加成员
    await this.cacheService.sAdd(`group:${groupId}:members`, userId);
  }

  async getUserGroups(userId: string): Promise<string[]> {
    // 获取用户所在的所有组
    return this.cacheService.sMembers(`user:${userId}:groups`);
  }

  async incrementCounter(key: string): Promise<number> {
    // 使用原生Redis客户端执行特殊命令
    const redisClient = this.cacheService.getClient<Redis>();
    return redisClient.incr(key);
  }

  async acquireLock(resource: string): Promise<string | null> {
    // 获取分布式锁
    return this.cacheService.acquireLock(
      `lock:${resource}`,
      30, // 锁定30秒
      5, // 最多重试5次
      200, // 每次重试间隔200毫秒
    );
  }
}
```

## 缓存服务接口

缓存服务提供两个层次的接口：

1. `ICacheService` - 基础缓存操作接口

   - get, set, del, reset, has

2. `IAdvancedCacheService` - 高级缓存操作接口（Redis特有功能）
   - 继承ICacheService的所有方法
   - 哈希表操作: hSet, hGet, hGetAll, hDel, hExists...
   - 列表操作: lPush, rPush, lPop, rPop, lRange...
   - 集合操作: sAdd, sMembers, sIsMember, sRem...
   - 有序集合操作: zAdd, zRange, zScore...
   - 分布式锁: acquireLock, releaseLock
   - 发布/订阅: publish, subscribe, unsubscribe

## 实现说明

模块包含两种缓存实现：

1. `MemoryCacheService` - 基于@nestjs/cache-manager的内存缓存
2. `IoRedisCacheService` - 直接基于ioredis的高级缓存

根据注册时的配置自动选择合适的实现。
