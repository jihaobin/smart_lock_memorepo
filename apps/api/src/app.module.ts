import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from './common/auth/jwt-auth.guard';
import { CacheModule } from './common/cache';
import { ExceptionsModule } from './common/exceptions';
import { InterceptorsModule } from './common/interceptors';
import { LoggerModule, LogFormatterType, LogLevel } from './common/logger';
import { LoggerMiddleware } from './common/logger/middleware/logger.middleware';
import ConfigModule from './config/config.module';
import { APP_CONFIG, AppConfig } from './config/config.provider';
import DatabaseModule from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';

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

    // JWT模块，用于JWT验证
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.JWT_SECRET,
        signOptions: {
          expiresIn: config.JWT_EXPIRES_IN,
        },
      }),
    }),

    // 缓存模块 - 使用简单同步注册
    CacheModule.register(),

    // 数据库和配置模块
    DatabaseModule,
    ConfigModule,

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

    // 业务模块
    AuthModule,
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
