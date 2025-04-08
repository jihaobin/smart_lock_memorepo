import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AppLoggerService } from '../logger';

// 定义一个更精确的缓存管理器接口
interface TypedCache {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
}

/**
 * 缓存拦截器选项接口
 */
export interface CacheInterceptorOptions {
  /**
   * 缓存TTL（秒）
   */
  ttl?: number;

  /**
   * 是否记录缓存日志
   */
  logCacheEvents?: boolean;

  /**
   * 缓存键前缀
   */
  keyPrefix?: string;
}

/**
 * 缓存拦截器
 * 用于缓存API响应
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly defaultOptions: CacheInterceptorOptions = {
    ttl: 60, // 默认缓存60秒
    logCacheEvents: true,
    keyPrefix: 'api-cache:',
  };

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly logger: AppLoggerService,
    private readonly options: CacheInterceptorOptions = {},
  ) {
    this.logger.setContext('CacheInterceptor');
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * 拦截方法
   * @param context 执行上下文
   * @param next 调用处理器
   * @returns 处理后的Observable
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    // 只缓存GET请求
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;

    if (method !== 'GET') {
      return next.handle();
    }

    // 生成缓存键
    const key = this.generateCacheKey(request);

    // 尝试从缓存获取数据
    const cachedData: unknown = await (
      this.cacheManager as unknown as TypedCache
    ).get<unknown>(key);

    if (cachedData) {
      if (this.options.logCacheEvents) {
        this.logger.debug(`缓存命中 - ${method} ${url}`, 'CacheInterceptor');
      }
      return of(cachedData);
    }

    // 缓存未命中，执行原始请求并缓存结果
    if (this.options.logCacheEvents) {
      this.logger.debug(`缓存未命中 - ${method} ${url}`, 'CacheInterceptor');
    }

    return next.handle().pipe(
      tap((data) => {
        // 使用void操作符忽略Promise结果
        void (this.cacheManager as unknown as TypedCache).set(
          key,
          data,
          ((this.options?.ttl || this.defaultOptions.ttl)) as number * 1000,
        );

        if (this.options?.logCacheEvents) {
          this.logger.debug(
            `缓存已设置 - ${method} ${url} - TTL: ${this.options?.ttl || this.defaultOptions.ttl}s`,
            'CacheInterceptor',
          );
        }
      }),
    );
  }

  /**
   * 生成缓存键
   * @param request HTTP请求
   * @returns 缓存键
   */
  private generateCacheKey(request: Request): string {
    const { url, query } = request;
    // 类型安全的查询参数处理
    const typedQuery: Record<string, unknown> = query || {};

    const queryString = Object.keys(typedQuery)
      .sort()
      .map((key) => {
        // 安全地将值转换为字符串
        const value = typedQuery[key];
        const safeValue =
          typeof value === 'object' && value !== null
            ? JSON.stringify(value)
            : String(value);
        return `${key}=${safeValue}`;
      })
      .join('&');

    const cacheKey: string = queryString ? `${url}?${queryString}` : url;

    return `${this.options?.keyPrefix || this.defaultOptions.keyPrefix}${cacheKey}`;
  }
}
