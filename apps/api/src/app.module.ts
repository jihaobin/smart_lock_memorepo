import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AppController } from './app.controller';
import { ExceptionsModule } from './common/exceptions';
import { InterceptorsModule } from './common/interceptors';
import { LoggerModule, LogFormatterType, LogLevel } from './common/logger';
import { LoggerMiddleware } from './common/logger/middleware/logger.middleware';
import ConfigModule from './config/config.module';
import DatabaseModule from './database/database.module';

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
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 为所有路由应用日志中间件
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
