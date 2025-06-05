import * as path from 'path';

import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { patchNestJsSwagger } from 'nestjs-zod';

import { AppModule } from './app.module';
import { AppLoggerService, HttpExceptionFilter } from './common';
import { setupSwagger } from './common/swagger/swagger.module';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = await app.resolve(AppLoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // 设置全局路由前缀，不包括通配符路由
  app.setGlobalPrefix('/api', {
    exclude: ['*', '*path'],
  });

  // 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // 允许localhost和127.0.0.1的任意端口访问
  const clientUrl = process.env.NEXT_PUBLIC_APP_URL || [
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
  ];
  app.enableCors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // 添加Swagger文档
  patchNestJsSwagger();
  setupSwagger(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`应用已启动，监听端口: ${port}`);
}

bootstrap().catch((err) => {
  console.error('应用启动失败:', err);
  process.exit(1);
});
