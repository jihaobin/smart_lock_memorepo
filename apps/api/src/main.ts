import * as path from 'path';

import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';

import { AppModule } from './app.module';
import { AppLoggerService, HttpExceptionFilter } from './common';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = await app.resolve(AppLoggerService);
  logger.setContext('Bootstrap');
  app.useLogger(logger);

  // 注册全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`应用已启动，监听端口: ${port}`);
}

bootstrap().catch((err) => {
  console.error('应用启动失败:', err);
  process.exit(1);
});
