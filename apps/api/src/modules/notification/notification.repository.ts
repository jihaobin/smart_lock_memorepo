import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_ENUM, IMPORTANCE_LEVEL } from '@smart-lock/shared';
import { DbType, schema } from '@smart-lock/shared/server';
import { sql, eq } from 'drizzle-orm';
import { AppLoggerService } from 'src/common';
import { DB } from 'src/database/database.provider';

// 定义通知方法枚举
const NOTIFICATION_METHOD = {
  APP: 'app',
  SMS: 'sms',
  CALL: 'call',
} as const;

type NotificationMethod =
  (typeof NOTIFICATION_METHOD)[keyof typeof NOTIFICATION_METHOD];

// 定义通知状态枚举
const DELIVERY_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

type DeliveryStatus = (typeof DELIVERY_STATUS)[keyof typeof DELIVERY_STATUS];

@Injectable()
export class NotificationRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(NotificationRepository.name);
  }

  /**
   * 创建新的通知记录
   */
  async createNotification(data: {
    userId: string;
    type: (typeof NOTIFICATION_ENUM)[keyof typeof NOTIFICATION_ENUM];
    message: string;
    data?: Record<string, unknown>;
    deviceId?: string;
    importanceLevel?: (typeof IMPORTANCE_LEVEL)[keyof typeof IMPORTANCE_LEVEL];
    notificationMethod?: NotificationMethod;
  }) {
    try {
      const notificationData = {
        userId: data.userId,
        type: data.type,
        message: data.message,
        data: data.data || {},
        deviceId: data.deviceId,
        importanceLevel: data.importanceLevel || IMPORTANCE_LEVEL.MEDIUM,
        notificationMethod: data.notificationMethod || NOTIFICATION_METHOD.APP,
        deliveryStatus: DELIVERY_STATUS.PENDING,
      };

      const [notification] = await this.db
        .insert(schema.notifications)
        .values(notificationData)
        .returning();

      return notification;
    } catch (error) {
      this.logger.error(`创建通知记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 创建通知发送记录
   */
  async createDeliveryLog(data: {
    notificationId: string;
    deliveryMethod: NotificationMethod;
    targetNumber?: string;
    status?: DeliveryStatus;
  }) {
    try {
      const deliveryLogData = {
        notificationId: data.notificationId,
        deliveryMethod: data.deliveryMethod,
        targetNumber: data.targetNumber || '',
        status: data.status || DELIVERY_STATUS.PENDING,
      };

      const [log] = await this.db
        .insert(schema.notificationDeliveryLogs)
        .values(deliveryLogData)
        .returning();

      return log;
    } catch (error) {
      this.logger.error(`创建通知发送记录失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新通知状态
   */
  async updateNotificationStatus(
    notificationId: string,
    status: DeliveryStatus,
  ) {
    try {
      await this.db
        .update(schema.notifications)
        .set({ deliveryStatus: status })
        .where(eq(schema.notifications.id, notificationId));
    } catch (error) {
      this.logger.error(`更新通知状态失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新通知发送记录状态
   */
  async updateDeliveryLogStatus(
    logId: string,
    status: DeliveryStatus,
    errorMessage?: string,
    retryCount?: number,
    additionalData?: {
      aliYunMsgId?: string;
      maxDeliveryTime?: Date;
    },
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status,
      };

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      if (
        status === DELIVERY_STATUS.DELIVERED ||
        status === DELIVERY_STATUS.FAILED
      ) {
        updateData.completionTime = sql`NOW()`;
      }

      if (retryCount !== undefined) {
        updateData.retryCount = retryCount;
      }

      // 添加额外数据字段
      if (additionalData) {
        if (additionalData.aliYunMsgId) {
          updateData.aliYunMsgId = additionalData.aliYunMsgId;
        }
        if (additionalData.maxDeliveryTime) {
          updateData.maxDeliveryTime = additionalData.maxDeliveryTime;
        }
      }

      await this.db
        .update(schema.notificationDeliveryLogs)
        .set(updateData)
        .where(eq(schema.notificationDeliveryLogs.id, logId));
    } catch (error) {
      this.logger.error(
        `更新通知发送记录状态失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 查找所有待处理的短信发送记录
   * 这些记录的状态为"sent"但还没有确认是否送达
   */
  async findPendingSmsDeliveryLogs() {
    try {
      const logs = await this.db.query.notificationDeliveryLogs.findMany({
        where: (notificationLogs, { eq, and, isNotNull }) =>
          and(
            eq(notificationLogs.status, DELIVERY_STATUS.SENT),
            eq(notificationLogs.deliveryMethod, NOTIFICATION_METHOD.SMS),
            isNotNull(notificationLogs.aliYunMsgId),
          ),
      });

      return logs;
    } catch (error) {
      this.logger.error(
        `查找待处理的短信发送记录失败: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * 根据阿里云消息ID查找发送记录
   */
  async findDeliveryLogByAliYunMsgId(messageId: string) {
    try {
      const logs = await this.db.query.notificationDeliveryLogs.findMany({
        where: (notificationLogs, { eq }) =>
          eq(notificationLogs.aliYunMsgId, messageId),
      });

      return logs;
    } catch (error) {
      this.logger.error(
        `根据阿里云消息ID查找发送记录失败: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * 根据通知ID查找发送记录
   */
  async findDeliveryLogsByNotificationId(notificationId: string) {
    try {
      const logs = await this.db.query.notificationDeliveryLogs.findMany({
        where: eq(
          schema.notificationDeliveryLogs.notificationId,
          notificationId,
        ),
        orderBy: schema.notificationDeliveryLogs.attemptTime,
      });

      return logs;
    } catch (error) {
      this.logger.error(`查找通知发送记录失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 根据ID查找通知
   */
  async findNotificationById(notificationId: string) {
    try {
      const notification = await this.db.query.notifications.findFirst({
        where: eq(schema.notifications.id, notificationId),
      });

      return notification;
    } catch (error) {
      this.logger.error(`查找通知失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 获取用户的手机号
   */
  async getUserPhone(userId: string): Promise<string | null> {
    try {
      const user = await this.db.query.users.findFirst({
        where: eq(schema.users.id, userId),
        columns: {
          phone: true,
        },
      });

      return user ? user.phone : null;
    } catch (error) {
      this.logger.error(`获取用户手机号失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取通知列表
   * 根据用户ID和过滤条件查询通知列表，支持分页
   */
  async findNotificationsByUserId(
    userId: string,
    page: number,
    pageSize: number,
    filters?: {
      type?: (typeof NOTIFICATION_ENUM)[keyof typeof NOTIFICATION_ENUM];
      deviceId?: string;
      importanceLevel?: (typeof IMPORTANCE_LEVEL)[keyof typeof IMPORTANCE_LEVEL];
      fromDate?: string;
      toDate?: string;
    },
  ) {
    try {
      // 使用函数式查询构建器，更符合Drizzle最佳实践
      const query = await this.db.query.notifications.findMany({
        where: (notifications, { and, eq, between, gte, lte }) => {
          const conditions = [eq(notifications.userId, userId)];

          if (filters) {
            // 添加类型过滤
            if (filters.type) {
              conditions.push(eq(notifications.type, filters.type));
            }

            // 添加设备ID过滤
            if (filters.deviceId) {
              conditions.push(eq(notifications.deviceId, filters.deviceId));
            }

            // 添加重要性级别过滤
            if (filters.importanceLevel) {
              conditions.push(
                eq(notifications.importanceLevel, filters.importanceLevel),
              );
            }

            // 处理日期范围过滤
            if (filters.fromDate || filters.toDate) {
              // 如果同时有开始和结束日期，使用between操作符
              if (filters.fromDate && filters.toDate) {
                const fromDate = new Date(filters.fromDate);
                const toDate = new Date(filters.toDate);
                // 设置为当天的结束时间
                toDate.setHours(23, 59, 59, 999);

                conditions.push(
                  between(notifications.timestamp, fromDate, toDate),
                );
              } else if (filters.fromDate) {
                // 只有开始日期
                const fromDate = new Date(filters.fromDate);
                conditions.push(gte(notifications.timestamp, fromDate));
              } else if (filters.toDate) {
                // 只有结束日期
                const toDate = new Date(filters.toDate);
                // 设置为当天的结束时间
                toDate.setHours(23, 59, 59, 999);
                conditions.push(lte(notifications.timestamp, toDate));
              }
            }
          }
          return and(...conditions);
        },
        orderBy: (notifications, { desc }) => [desc(notifications.timestamp)],
        with: {
          device: true,
        },
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      // 获取总记录数 - 使用更简洁的count查询
      const countQuery = await this.db.query.notifications.findMany({
        where: (notifications, { and, eq, between, gte, lte }) => {
          const conditions = [eq(notifications.userId, userId)];

          if (filters) {
            if (filters.type) {
              conditions.push(eq(notifications.type, filters.type));
            }
            if (filters.deviceId) {
              conditions.push(eq(notifications.deviceId, filters.deviceId));
            }
            if (filters.importanceLevel) {
              conditions.push(
                eq(notifications.importanceLevel, filters.importanceLevel),
              );
            }

            // 处理日期范围过滤
            if (filters.fromDate || filters.toDate) {
              if (filters.fromDate && filters.toDate) {
                const fromDate = new Date(filters.fromDate);
                const toDate = new Date(filters.toDate);
                toDate.setHours(23, 59, 59, 999);
                conditions.push(
                  between(notifications.timestamp, fromDate, toDate),
                );
              } else if (filters.fromDate) {
                conditions.push(
                  gte(notifications.timestamp, new Date(filters.fromDate)),
                );
              } else if (filters.toDate) {
                const toDate = new Date(filters.toDate);
                toDate.setHours(23, 59, 59, 999);
                conditions.push(lte(notifications.timestamp, toDate));
              }
            }
          }

          return and(...conditions);
        },
        columns: {
          id: true,
        },
      });

      const total = countQuery.length;

      return {
        items: query,
        total,
        page,
        limit: Number(pageSize),
      };
    } catch (error) {
      this.logger.error(`查找通知列表失败: ${error.message}`, error.stack);
      return {
        items: [],
        total: 0,
        page: 0,
        limit: 0,
      };
    }
  }
}
