import { Module, Global, Provider } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { HttpExceptionFilter } from './http-exception.filter';
import ConfigModule from '../../config/config.module';
import { APP_CONFIG, type AppConfig } from '../../config/config.provider';
import { AppLoggerService } from '../logger';
import { LoggerModule } from '../logger/logger.module';

/**
 * 异常模块配置接口
 */
export interface ExceptionsModuleOptions {
  /**
   * 是否启用全局异常过滤器
   */
  enableGlobalFilter?: boolean;
}

/**
 * 异常模块
 * 用于全局注册和配置异常过滤器
 */
@Global()
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class ExceptionsModule {
  /**
   * 使用自定义配置创建异常模块
   * @param options 异常模块配置
   * @returns 动态模块
   */
  static forRoot(options: ExceptionsModuleOptions = {}) {
    const { enableGlobalFilter = true } = options;

    const providers: Provider[] = [
      {
        provide: HttpExceptionFilter,
        useFactory: (logger: AppLoggerService, config: AppConfig) =>
          new HttpExceptionFilter(logger, config.NODE_ENV !== 'production'),
        inject: [AppLoggerService, APP_CONFIG],
      },
    ];

    // 注册全局异常过滤器
    if (enableGlobalFilter) {
      providers.push({
        provide: APP_FILTER,
        useExisting: HttpExceptionFilter,
      });
    }

    return {
      module: ExceptionsModule,
      imports: [ConfigModule, LoggerModule],
      providers,
      exports: [HttpExceptionFilter],
    };
  }
}
