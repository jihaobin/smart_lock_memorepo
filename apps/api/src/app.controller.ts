import { Controller, Get, Inject } from '@nestjs/common';
import { schema, DbType } from '@smart-lock/shared';

import { APP_CONFIG, AppConfig } from './config/config.provider';
import { DB } from './database/database.provider';

@Controller()
export class AppController {
  @Inject(DB)
  private readonly db: DbType;
  @Inject(APP_CONFIG)
  private readonly config: AppConfig;
  @Get()
  async getHello() {
    await this.db
      .insert(schema.users)
      .values({
        email: 'test@test.com',
        passwordHash: 'test',
      })
      .returning();
    return this.config.JWT_EXPIRES_IN;
  }
}
