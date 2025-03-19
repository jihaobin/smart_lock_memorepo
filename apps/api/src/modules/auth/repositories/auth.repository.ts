import { Injectable, Inject } from '@nestjs/common';
import { DbType, RegisterSchemaType, schema } from '@smart-lock/shared';
import { eq } from 'drizzle-orm';

import { DB } from '../../../database/database.provider';

@Injectable()
export class AuthRepository {
  constructor(@Inject(DB) private readonly db: DbType) {}

  /**
   * 根据邮箱查找用户
   * @param email 用户邮箱
   * @returns 用户信息或null
   */
  async findUserByEmail(email: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    return result[0] || null;
  }

  /**
   * 创建新用户
   * @param userData 用户数据
   * @param passwordHash 加密后的密码
   * @returns 创建的用户
   */
  async createUser(userData: RegisterSchemaType, passwordHash: string) {
    const result = await this.db
      .insert(schema.users)
      .values({
        email: userData.email,
        nikeName: userData.nikeName,
        passwordHash: passwordHash,
      })
      .returning();

    return result[0];
  }

  /**
   * 更新用户密码
   * @param email 用户邮箱
   * @param passwordHash 新的密码哈希
   * @returns 更新后的用户
   */
  async updateUserPassword(email: string, passwordHash: string) {
    const result = await this.db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.email, email))
      .returning();

    return result[0];
  }
}
