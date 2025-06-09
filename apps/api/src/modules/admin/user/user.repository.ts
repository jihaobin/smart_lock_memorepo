import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  GetAllUsersType,
  GetUserByPhoneType,
  UserItem,
  GetAllUsersResponse,
} from '@smart-lock/shared';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq } from 'drizzle-orm';
import { DB } from 'src/database/database.provider';

@Injectable()
export class UserRepository {
  constructor(@Inject(DB) private readonly db: DbType) {}

  /**
   * 获取所有用户列表（分页）
   */
  async getAllUsers(query: GetAllUsersType): Promise<GetAllUsersResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const offset = (page - 1) * pageSize;

    try {
      // 查询用户列表，排除敏感信息
      const users = await this.db.query.users.findMany({
        offset,
        limit: pageSize,
        columns: {
          id: true,
          phone: true,
          nikeName: true,
          createdAt: true,
          updatedAt: true,
          // 排除 passwordHash
        },
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      // 获取总数
      const total = await this.db.$count(schema.users);

      return {
        items: users,
        total,
        page,
        pageSize,
      };
    } catch (error) {
      throw new BadRequestException('获取用户列表失败');
    }
  }

  /**
   * 根据ID获取单个用户
   */
  async findUserById(id: string): Promise<UserItem> {
    if (!id) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, id),
        columns: {
          id: true,
          phone: true,
          nikeName: true,
          createdAt: true,
          updatedAt: true,
          // 排除 passwordHash
        },
      });

      if (!user) {
        throw new NotFoundException(`用户不存在 (ID: ${id})`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('查询用户失败');
    }
  }

  /**
   * 根据手机号查询用户
   */
  async findUserByPhone(phoneData: GetUserByPhoneType): Promise<UserItem> {
    const { phone } = phoneData;

    try {
      const user = await this.db.query.users.findFirst({
        where: phone ? eq(schema.users.phone, phone) : undefined,
        columns: {
          id: true,
          phone: true,
          nikeName: true,
          createdAt: true,
          updatedAt: true,
          // 排除 passwordHash
        },
      });

      if (!user) {
        throw new NotFoundException(`手机号为 ${phone} 的用户不存在`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('根据手机号查询用户失败');
    }
  }
}
