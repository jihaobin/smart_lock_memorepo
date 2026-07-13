import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';

import { STSModule } from './common';
import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { JwtSharedModule } from './common/auth/jwt-shared.module';
import { JwtStrategy } from './common/auth/strategies/jwt.strategy';
import { CacheModule, CacheType } from './common/cache';
import { ExceptionsModule } from './common/exceptions';
import { InterceptorsModule } from './common/interceptors';
import { LoggerModule, LogFormatterType, LogLevel } from './common/logger';
import { LoggerMiddleware } from './common/logger/middleware/logger.middleware';
import ConfigModule from './config/config.module';
import { APP_CONFIG, type AppConfig } from './config/config.provider';
import DatabaseModule from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { DeviceModule } from './modules/device/device.module';
import { FriendModule } from './modules/friend/friend.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TemporaryPasswordModule } from './modules/temporary-password/temporary-password.module';
import { UnLockRecordModule } from './modules/unLockRecord/unLockRecord.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // 日志模块
    ConfigModule,
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => {
        const isDevelopment = config.NODE_ENV !== 'production';
        return {
          appName: 'smart-lock-api',
          isDevelopment,
          defaultLevel: isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
          formatter: {
            type: isDevelopment
              ? LogFormatterType.DETAILED
              : LogFormatterType.JSON,
            timestamp: true,
            colors: isDevelopment,
          },
        };
      },
    }),

    // 配置和数据库模块先导入
    DatabaseModule,

    // 定时任务模块
    ScheduleModule.forRoot(),

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
    FriendModule,
    DeviceModule,
    TemporaryPasswordModule,
    UnLockRecordModule,
    AdminModule, // 添加管理员模块

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
    JwtStrategy,
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
