import { Injectable, Inject } from '@nestjs/common';
import { DbType, RegisterSchemaType, schema } from '@smart-lock/shared/server';
import { eq } from 'drizzle-orm';
import type { InferModel } from 'drizzle-orm';

import { DB } from '../../../database/database.provider';

type NewUser = InferModel<typeof schema.users, 'insert'>;

@Injectable()
export class AuthRepository {
  constructor(@Inject(DB) private readonly db: DbType) {}

  /**
   * 根据手机号查找用户
   * @param phone 用户手机号
   * @returns 用户信息或null
   */
  async findUserByPhone(phone: string) {
    const result = await this.db
      .select()
      .from(schema.users)
      .where(eq(schema.users.phone, phone))
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
    if (!userData.phone || !userData.nikeName) {
      throw new Error('手机号和昵称是必需的');
    }

    const newUser: NewUser = {
      phone: userData.phone,
      nikeName: userData.nikeName,
      passwordHash: passwordHash,
    };

    const result = await this.db
      .insert(schema.users)
      .values(newUser)
      .returning();

    return result[0];
  }

  /**
   * 更新用户密码
   * @param phone 用户手机号
   * @param passwordHash 新的密码哈希
   * @returns 更新后的用户
   */
  async updateUserPassword(phone: string, passwordHash: string) {
    const result = await this.db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.phone, phone))
      .returning();

    return result[0];
  }
}
