import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { STSModule } from './common';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { JwtSharedModule } from './common/auth/jwt-shared.module';
import { CacheModule, CacheType } from './common/cache';
import { ExceptionsModule } from './common/exceptions';
import { InterceptorsModule } from './common/interceptors';
import { LoggerModule, LogFormatterType, LogLevel } from './common/logger';
import { LoggerMiddleware } from './common/logger/middleware/logger.middleware';
import ConfigModule from './config/config.module';
import DatabaseModule from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    // 日志模块
    LoggerModule.forRoot({
      appName: 'smart-lock-api',
      isDevelopment: process.env.NODE_ENV !== 'production',
      defaultLevel:
        process.env.NODE_ENV !== 'production' ? LogLevel.DEBUG : LogLevel.INFO,
      formatter: {
        type:
          process.env.NODE_ENV !== 'production'
            ? LogFormatterType.DETAILED
            : LogFormatterType.JSON,
        timestamp: true,
        colors: process.env.NODE_ENV !== 'production',
      },
    }),

    // 配置和数据库模块先导入
    ConfigModule,
    DatabaseModule,

    // JWT 模块
    JwtSharedModule,

    // BullMQ 模块
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),

    // 业务模块
    AuthModule,
    NotificationModule,

    // 缓存模块 - 使用redis
    CacheModule.registerAsync({
      type: CacheType.IOREDIS,
      redisOptions: {
        host: 'localhost',
        port: 6379,
        db: 0,
      },
    }),

    // 功能模块
    STSModule,

    // 异常过滤器模块
    ExceptionsModule.forRoot({
      enableGlobalFilter: true,
    }),

    // 拦截器模块
    InterceptorsModule.forRoot({
      enableTransform: true,
      enableTimeout: true,
      timeout: 30000,
      defaultSuccessMessage: '操作成功',
    }),
  ],
  controllers: [],
  providers: [
    // 全局注册JWT守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 为所有路由应用日志中间件
    consumer.apply(LoggerMiddleware).forRoutes('*path');
  }
}
