import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DbType, schema } from '@smart-lock/shared/server';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { AppLoggerService } from 'src/common';
import { DB } from 'src/database/database.provider';

@Injectable()
export class AdminAuthRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(AdminAuthRepository.name);
  }

  async findUserByName(name: string) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('用户名不能为空');
    }

    try {
      const result = await this.db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.name, name.trim()))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.logger.error(`查询用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  async findUserById(id: string) {
    if (!id) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      const result = await this.db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.logger.error(`通过ID查询用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  async createUser(userData: { name: string; passwordHash: string }) {
    if (!userData.name || userData.name.trim() === '') {
      throw new BadRequestException('用户名不能为空');
    }

    if (!userData.passwordHash) {
      throw new BadRequestException('密码哈希不能为空');
    }

    try {
      // 检查用户名是否已存在
      const existingUser = await this.findUserByName(userData.name);
      if (existingUser) {
        throw new BadRequestException('用户名已存在');
      }

      const result = await this.db
        .insert(schema.adminUsers)
        .values({
          name: userData.name.trim(),
          passwordHash: userData.passwordHash,
        })
        .returning();

      return result[0];
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`创建用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('创建用户失败');
    }
  }

  async updateUserPassword(id: string, passwordHash: string) {
    if (!id) {
      throw new BadRequestException('用户ID不能为空');
    }

    if (!passwordHash) {
      throw new BadRequestException('密码哈希不能为空');
    }

    try {
      // 检查用户是否存在
      const existingUser = await this.findUserById(id);
      if (!existingUser) {
        throw new NotFoundException(`ID为${id}的用户不存在`);
      }

      const result = await this.db
        .update(schema.adminUsers)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(schema.adminUsers.id, id))
        .returning();

      return result[0];
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`更新用户密码失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('更新用户密码失败');
    }
  }

  async validatePassword(plainPassword: string, hashedPassword: string) {
    if (!plainPassword) {
      throw new BadRequestException('密码不能为空');
    }

    if (!hashedPassword) {
      throw new BadRequestException('哈希密码不能为空');
    }

    try {
      // 仅使用默认参数进行验证，因为哈希中已包含必要的参数信息
      return await argon2.verify(hashedPassword, plainPassword);
    } catch (error) {
      this.logger.error(`密码验证失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('密码验证失败');
    }
  }

  async hashPassword(password: string) {
    if (!password) {
      throw new BadRequestException('密码不能为空');
    }

    // 密码强度验证
    if (password.length < 8) {
      throw new BadRequestException('密码长度不能少于8个字符');
    }

    // 检查密码复杂度
    if (!/(?=.*[A-Z])/.test(password)) {
      throw new BadRequestException('密码必须包含至少一个大写字母');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new BadRequestException('密码必须包含至少一个小写字母');
    }

    if (!/(?=.*[0-9])/.test(password)) {
      throw new BadRequestException('密码必须包含至少一个数字');
    }

    try {
      // 使用argon2id，它结合了argon2i和argon2d的安全性
      return await argon2.hash(password, {
        type: argon2.argon2id,
        // 增加时间成本，提高安全性（默认值为3）
        timeCost: 4,
        // 增加内存成本，提高安全性（默认值为4096 KiB）
        memoryCost: 16384,
        // 增加并行度，提高安全性（默认值为1）
        parallelism: 2,
      });
    } catch (error) {
      this.logger.error(`密码加密失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('密码加密失败');
    }
  }
}
