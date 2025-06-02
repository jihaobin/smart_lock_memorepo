import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { DbType, TemporaryPasswordInfo } from '@smart-lock/shared';
import { schema } from '@smart-lock/shared/server';
import {
  eq,
  and,
  between,
  desc,
  SQL,
  sql,
  gte,
  gt,
  isNull,
  or,
} from 'drizzle-orm';
import { DB } from 'src/database/database.provider';

import {
  CreateUnlockRecordDto,
  QueryUnlockRecordDto,
  UpdateUnlockRecordDto,
} from './schema';

@Injectable()
export class UnLockRecordService {
  @Inject(DB) db: DbType;

  /**
   * 创建临时密码开锁记录
   * @param temporaryPassword 临时密码
   * @param deviceId 设备ID
   * @returns 开锁记录
   */
  async createTemporaryPasswordUnlockRecord(
    temporaryPassword: string,
    deviceId: string,
  ) {
    // 使用事务处理整个过程
    return await this.db.transaction(async (tx) => {
      // 先获取查询结果数组
      const results = await tx
        .select()
        .from(schema.temporaryPasswords)
        .where(
          and(
            eq(schema.temporaryPasswords.password, temporaryPassword),
            eq(schema.temporaryPasswords.deviceId, deviceId),
            or(
              // 没有剩余次数，有过期时间
              and(
                isNull(schema.temporaryPasswords.remainingUses),
                gt(schema.temporaryPasswords.expiresAt, new Date()),
              ),
              // 有剩余次数，没有过期时间
              and(
                gte(schema.temporaryPasswords.remainingUses, 1),
                isNull(schema.temporaryPasswords.expiresAt),
              ),
              // 有剩余次数，且过期时间大于当前时间
              and(
                gte(schema.temporaryPasswords.remainingUses, 1),
                gt(schema.temporaryPasswords.expiresAt, new Date()),
              ),
            ),
          ),
        )
        .for('update');

      // 安全访问第一个元素
      const temporaryPasswordInfo = results[0];

      if (!temporaryPasswordInfo) {
        throw new BadRequestException('临时密码不存在或已失效');
      }

      // 在事务内更新次数
      if (temporaryPasswordInfo.remainingUses) {
        await tx
          .update(schema.temporaryPasswords)
          .set({
            remainingUses: temporaryPasswordInfo.remainingUses - 1,
          })
          .where(eq(schema.temporaryPasswords.id, temporaryPasswordInfo.id));
      }

      // 在事务内创建开锁记录
      const unlockRecord = await this.createUnlockRecordInTransaction(tx, {
        deviceId,
        userId: temporaryPasswordInfo.creatorId,
        unlockType: 'temporary_password',
        unlockData: {
          temporaryInfo: {
            ...temporaryPasswordInfo,
            expiresAt: temporaryPasswordInfo.expiresAt || undefined,
            remainingUses:
              (temporaryPasswordInfo.remainingUses &&
                temporaryPasswordInfo.remainingUses - 1) ||
              undefined,
          },
        },
      });

      return unlockRecord;
    });
  }

  // 新增事务内创建记录的辅助方法
  private async createUnlockRecordInTransaction(
    tx,
    data: CreateUnlockRecordDto & {
      unlockData?: {
        temporaryInfo?: TemporaryPasswordInfo;
        friendName?: string;
      };
    },
  ) {
    try {
      const result = await tx
        .insert(schema.unlockRecords)
        .values({
          deviceId: data.deviceId,
          userId: data.userId,
          unlockType: data.unlockType,
          unlockData: data.unlockData || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('创建开锁记录失败:', error);
      throw new BadRequestException('创建开锁记录失败');
    }
  }
  /**
   * 创建开锁记录
   * @param data 开锁记录数据
   */
  async createUnlockRecord(data: CreateUnlockRecordDto) {
    console.log('createUnlockRecord', data);
    if (
      data.unlockType === 'temporary_password' &&
      data.unlockData?.password &&
      data.userId
    ) {
      return await this.createTemporaryPasswordUnlockRecord(
        String(data.unlockData.password), // 确保转换为字符串
        data.deviceId,
      );
    }

    try {
      const result = await this.db
        .insert(schema.unlockRecords)
        .values({
          deviceId: data.deviceId,
          userId: data.userId,
          unlockType: data.unlockType,
          unlockData: data.unlockData || {},
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error('创建开锁记录失败:', error);
      throw new BadRequestException('创建开锁记录失败');
    }
  }

  /**
   * 根据ID获取开锁记录
   * @param id 记录ID
   */
  async getUnlockRecordById(id: string) {
    try {
      const result = await this.db.query.unlockRecords.findFirst({
        where: eq(schema.unlockRecords.id, id),
        with: {
          device: true,
          user: true,
        },
      });

      if (!result) {
        throw new NotFoundException('未找到该开锁记录');
      }

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('获取开锁记录失败:', error);
      throw new BadRequestException('获取开锁记录失败');
    }
  }

  /**
   * 更新开锁记录
   * @param id 记录ID
   * @param data 更新数据
   */
  async updateUnlockRecord(id: string, data: UpdateUnlockRecordDto) {
    try {
      // 先检查记录是否存在
      const existingRecord = await this.db.query.unlockRecords.findFirst({
        where: eq(schema.unlockRecords.id, id),
      });

      if (!existingRecord) {
        throw new NotFoundException('未找到该开锁记录');
      }

      // 执行更新
      const result = await this.db
        .update(schema.unlockRecords)
        .set({
          unlockData: data.unlockData || existingRecord.unlockData,
        })
        .where(eq(schema.unlockRecords.id, id))
        .returning();

      return result[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('更新开锁记录失败:', error);
      throw new BadRequestException('更新开锁记录失败');
    }
  }

  /**
   * 删除开锁记录
   * @param id 记录ID
   */
  async deleteUnlockRecord(id: string) {
    try {
      // 先检查记录是否存在
      const existingRecord = await this.db.query.unlockRecords.findFirst({
        where: eq(schema.unlockRecords.id, id),
      });

      if (!existingRecord) {
        throw new NotFoundException('未找到该开锁记录');
      }

      // 执行删除
      await this.db
        .delete(schema.unlockRecords)
        .where(eq(schema.unlockRecords.id, id));

      return { success: true };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('删除开锁记录失败:', error);
      throw new BadRequestException('删除开锁记录失败');
    }
  }

  /**
   * 查询开锁记录列表
   * @param query 查询参数
   */
  async queryUnlockRecords(query: QueryUnlockRecordDto) {
    try {
      const { page = '1', pageSize = '10' } = query;
      const offset = (Number.parseInt(page) - 1) * Number.parseInt(pageSize);

      // 构建查询条件
      const conditions: SQL[] = [];

      if (query.deviceId) {
        conditions.push(eq(schema.unlockRecords.deviceId, query.deviceId));
      }

      if (query.userId) {
        conditions.push(eq(schema.unlockRecords.userId, query.userId));
      }

      if (query.unlockType) {
        conditions.push(eq(schema.unlockRecords.unlockType, query.unlockType));
      }

      if (query.startTime && query.endTime) {
        conditions.push(
          between(
            schema.unlockRecords.timestamp,
            new Date(query.startTime),
            new Date(query.endTime),
          ),
        );
      }

      // 合并查询条件
      const whereCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      // 执行查询获取分页数据
      const records = await this.db.query.unlockRecords.findMany({
        where: whereCondition,
        limit: Number.parseInt(pageSize),
        offset,
        orderBy: [desc(schema.unlockRecords.timestamp)],
        with: {
          device: true,
          user: true,
        },
      });

      // 查询总记录数
      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(schema.unlockRecords)
        .where(whereCondition || undefined);

      const total = Number(countResult[0]?.count || 0);

      return {
        items: records,
        total,
        page,
        limit: Number(pageSize),
      };
    } catch (error) {
      console.error('查询开锁记录失败:', error);
      throw new BadRequestException('查询开锁记录失败');
    }
  }
}
