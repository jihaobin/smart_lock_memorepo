import { Controller, Get, Inject, Query } from '@nestjs/common';

import { APP_CONFIG, type AppConfig } from '../../../config/config.provider';
import { ICacheService } from '../interfaces/cache-service.interface';
import { CACHE_SERVICE } from '../providers/cache.provider';
import { MemoryCacheService } from '../services/memory-cache.service';

@Controller('api/debug/cache')
export class CacheDebugController {
  constructor(
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService,
    @Inject(APP_CONFIG)
    private readonly appConfig: AppConfig,
  ) {}

  @Get()
  async getAllCacheEntries(
    @Query('debug_key') debugKey?: string,
  ): Promise<{ keys: string[]; entries: Record<string, unknown> }> {
    // 简单的访问控制 - 生产环境应使用更安全的方式
    const secretKey = this.appConfig.DEBUG_KEY;
    if (debugKey !== secretKey) {
      return {
        keys: [],
        entries: { message: '需要访问密钥' },
      };
    }

    // 检查是否为内存缓存服务
    if (this.cacheService instanceof MemoryCacheService) {
      const entries = await (
        this.cacheService as MemoryCacheService
      ).getAllCacheEntries();
      return {
        keys: Object.keys(entries),
        entries,
      };
    }

    // 其他缓存服务可能不支持此操作
    return {
      keys: [],
      entries: {},
    };
  }
}
