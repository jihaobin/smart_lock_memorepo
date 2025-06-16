import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbType, TemporaryPasswordInfo } from '@smart-lock/shared';
import { schema } from '@smart-lock/shared/server';
import {
  eq,
  and,
  gte,
  lt,
  desc,
  asc,
  sql,
  inArray,
  or,
  isNull,
  SQL,
  gt,
} from 'drizzle-orm';
import { AppLoggerService } from 'src/common';

import {
  CreateTemporaryPasswordDto,
  QueryTemporaryPasswordDto,
  BatchDeleteTemporaryPasswordDto,
  ValidateTemporaryPasswordDto,
} from './dto';
import { DB } from '../../database/database.provider';
import { NotificationQueueService } from '../notification/queues/notification-queue.service';

@Injectable()
export class TemporaryPasswordService {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(NotificationQueueService.name);
  }

  /**
   * 创建临时密码
   * 性能优化：使用事务确保数据一致性
   */
  async create(
    creatorId: string,
    createDto: CreateTemporaryPasswordDto,
  ): Promise<TemporaryPasswordInfo> {
    return await this.db.transaction(async (tx) => {
      // 验证设备是否存在
      const device = await tx.query.devices.findFirst({
        where: eq(schema.devices.id, createDto.deviceId),
      });

      if (!device) {
        throw new NotFoundException('设备不存在');
      }

      // 检查是否已存在相同密码
      const existingPassword = await tx
        .select()
        .from(schema.temporaryPasswords)
        .where(
          and(
            eq(schema.temporaryPasswords.name, createDto.name),
            eq(schema.temporaryPasswords.creatorId, creatorId),
            eq(schema.temporaryPasswords.password, createDto.password),
            eq(schema.temporaryPasswords.deviceId, createDto.deviceId),
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

      if (existingPassword.length > 0) {
        throw new BadRequestException('该设备已存在相同的有效临时密码');
      }

      const [result] = await tx
        .insert(schema.temporaryPasswords)
        .values({
          creatorId,
          deviceId: createDto.deviceId,
          password: createDto.password,
          expiresAt: createDto.expiresAt,
          remainingUses: createDto.remainingUses,
        })
        .returning();

      return result as TemporaryPasswordInfo;
    });
  }

  /**
   * 根据ID查找临时密码
   */
  async findById(id: string): Promise<TemporaryPasswordInfo | null> {
    const result = await this.db.query.temporaryPasswords.findFirst({
      where: eq(schema.temporaryPasswords.id, id),
      with: {
        device: {
          columns: { name: true },
          with: {
            deviceModel: {
              columns: { modelName: true },
            },
          },
        },
        creator: {
          columns: { nikeName: true, phone: true },
        },
      },
    });

    return result as TemporaryPasswordInfo | null;
  }

  /**
   * 分页查询临时密码
   */
  async findMany(queryDto: QueryTemporaryPasswordDto) {
    const { page, limit, deviceId, creatorId, sortBy, sortOrder } = queryDto;
    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const conditions: SQL[] = [
      // or(
      //   isNull(schema.temporaryPasswords.expiresAt),
      //   gte(schema.temporaryPasswords.expiresAt, new Date())
      // ) as SQL,
    ];

    if (deviceId) {
      conditions.push(eq(schema.temporaryPasswords.deviceId, deviceId));
    }

    if (creatorId) {
      conditions.push(eq(schema.temporaryPasswords.creatorId, creatorId));
    }

    // 添加有效性过滤条件：要么没有过期时间且剩余使用次数>0，要么有过期时间且未过期
    conditions.push(
      or(
        // 情况1：基于时间的密码 - 没有过期或者过期时间在未来
        and(
          isNull(schema.temporaryPasswords.remainingUses),
          or(
            isNull(schema.temporaryPasswords.expiresAt),
            gte(schema.temporaryPasswords.expiresAt, new Date()),
          ),
        ) as SQL,
        // 情况2：基于使用次数的密码 - 剩余使用次数大于0
        and(
          isNull(schema.temporaryPasswords.expiresAt),
          gte(schema.temporaryPasswords.remainingUses, 1),
        ) as SQL,
      ) as SQL,
    );

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 构建排序条件
    const orderByClause =
      sortOrder === 'desc'
        ? desc(schema.temporaryPasswords[sortBy])
        : asc(schema.temporaryPasswords[sortBy]);

    // 执行查询（利用索引优化）
    const [data, countResult] = await Promise.all([
      this.db.query.temporaryPasswords.findMany({
        where: whereClause,
        orderBy: orderByClause,
        limit: Number(limit),
        offset,
        with: {
          device: {
            columns: { name: true },
            with: {
              deviceModel: {
                columns: { modelName: true },
              },
            },
          },
          creator: {
            columns: { nikeName: true, phone: true },
          },
        },
      }),
      this.db
        .select({ count: sql`count(*)` })
        .from(schema.temporaryPasswords)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);

    return {
      items: data as TemporaryPasswordInfo[],
      total,
      page,
      limit,
    };
  }

  /**
   * 根据设备ID查找有效的临时密码
   */
  async findValidByDeviceId(
    deviceId: string,
  ): Promise<TemporaryPasswordInfo[]> {
    const result = await this.db.query.temporaryPasswords.findMany({
      where: and(
        eq(schema.temporaryPasswords.deviceId, deviceId),
        or(
          isNull(schema.temporaryPasswords.expiresAt),
          gte(schema.temporaryPasswords.expiresAt, new Date()),
        ),
      ),
      orderBy: desc(schema.temporaryPasswords.expiresAt),
    });

    return result as TemporaryPasswordInfo[];
  }

  /**
   * 根据创建者ID查找临时密码
   */
  async findByCreatorId(creatorId: string): Promise<TemporaryPasswordInfo[]> {
    const result = await this.db.query.temporaryPasswords.findMany({
      where: eq(schema.temporaryPasswords.creatorId, creatorId),
      orderBy: desc(schema.temporaryPasswords.expiresAt),
      with: {
        device: {
          columns: { name: true },
          with: {
            deviceModel: {
              columns: { modelName: true },
            },
          },
        },
      },
    });

    return result as TemporaryPasswordInfo[];
  }

  /**
   * 删除临时密码
   */
  async remove(id: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.temporaryPasswords)
      .where(eq(schema.temporaryPasswords.id, id))
      .returning({ id: schema.temporaryPasswords.id });

    return result.length > 0;
  }

  /**
   * 批量删除临时密码
   */
  async batchRemove(
    batchDeleteDto: BatchDeleteTemporaryPasswordDto,
  ): Promise<number> {
    const result = await this.db
      .delete(schema.temporaryPasswords)
      .where(inArray(schema.temporaryPasswords.id, batchDeleteDto.ids))
      .returning({ id: schema.temporaryPasswords.id });

    return result.length;
  }

  /**
   * 验证临时密码
   */
  async validatePassword(validateDto: ValidateTemporaryPasswordDto): Promise<{
    valid: boolean;
    passwordInfo?: TemporaryPasswordInfo;
    reason?: string;
  }> {
    return await this.db.transaction(async (tx) => {
      const passwordRecord = await tx.query.temporaryPasswords.findFirst({
        where: and(
          eq(schema.temporaryPasswords.deviceId, validateDto.deviceId),
          eq(schema.temporaryPasswords.password, validateDto.password),
        ),
      });

      if (!passwordRecord) {
        return { valid: false, reason: '密码不存在' };
      }

      // 检查是否过期
      if (passwordRecord.expiresAt && passwordRecord.expiresAt < new Date()) {
        return { valid: false, reason: '密码已过期' };
      }

      // 检查剩余使用次数
      if (
        passwordRecord.remainingUses !== null &&
        passwordRecord.remainingUses <= 0
      ) {
        return { valid: false, reason: '密码使用次数已用完' };
      }

      // 更新剩余使用次数
      if (passwordRecord.remainingUses !== null) {
        await tx
          .update(schema.temporaryPasswords)
          .set({ remainingUses: passwordRecord.remainingUses - 1 })
          .where(eq(schema.temporaryPasswords.id, passwordRecord.id));
      }

      return {
        valid: true,
        passwordInfo: passwordRecord as TemporaryPasswordInfo,
      };
    });
  }

  /**
   * 清理过期密码 - 定时任务
   * 每天凌晨3点执行
   */
  @Cron('0 3 * * *')
  async cleanupExpiredPasswords(): Promise<number> {
    try {
      this.logger.log('开始执行过期密码清理任务');

      const result = await this.db
        .delete(schema.temporaryPasswords)
        .where(
          and(
            lt(schema.temporaryPasswords.expiresAt, new Date()),
            eq(schema.temporaryPasswords.remainingUses, 0),
          ),
        )
        .returning({ id: schema.temporaryPasswords.id });

      const deletedCount = result.length;
      this.logger.log(
        `过期密码清理任务完成，共清理了 ${deletedCount} 条过期密码`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error('过期密码清理任务执行失败', error.stack);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  async getStatistics(deviceId?: string) {
    const baseCondition = deviceId
      ? eq(schema.temporaryPasswords.deviceId, deviceId)
      : undefined;

    const [totalCount, activeCount, expiredCount] = await Promise.all([
      // 总数
      this.db
        .select({ count: sql`count(*)` })
        .from(schema.temporaryPasswords)
        .where(baseCondition),
      // 有效数量
      this.db
        .select({ count: sql`count(*)` })
        .from(schema.temporaryPasswords)
        .where(
          baseCondition
            ? and(
                baseCondition,
                or(
                  isNull(schema.temporaryPasswords.expiresAt),
                  gte(schema.temporaryPasswords.expiresAt, new Date()),
                ),
              )
            : or(
                isNull(schema.temporaryPasswords.expiresAt),
                gte(schema.temporaryPasswords.expiresAt, new Date()),
              ),
        ),
      // 过期数量
      this.db
        .select({ count: sql`count(*)` })
        .from(schema.temporaryPasswords)
        .where(
          baseCondition
            ? and(
                baseCondition,
                lt(schema.temporaryPasswords.expiresAt, new Date()),
              )
            : lt(schema.temporaryPasswords.expiresAt, new Date()),
        ),
    ]);

    return {
      total: Number(totalCount[0]?.count || 0),
      active: Number(activeCount[0]?.count || 0),
      expired: Number(expiredCount[0]?.count || 0),
    };
  }
}
