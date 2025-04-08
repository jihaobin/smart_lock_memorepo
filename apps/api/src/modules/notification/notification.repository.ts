import { Inject, Injectable } from '@nestjs/common';
import { DbType, schema } from '@smart-lock/shared/server';
import { sql, eq } from 'drizzle-orm';
import { AppLoggerService } from 'src/common';
import { DB } from 'src/database/database.provider';

@Injectable()
export class NotificationRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext(NotificationRepository.name)
  }

  /**
   * 创建新的通知记录
   */
  async createNotification(data: {
    userId: string;
    type: 'doorbell' | 'device_open_alert' | 'device_low_battery' | 'device_broken' |
          'device_open' | 'device_close' | 'device_offline' | 'device_online' | 'firmware_update';
    message: string;
    data?: Record<string, unknown>;
    deviceId?: string;
    importanceLevel?: 'low' | 'medium' | 'high' | 'critical';
    notificationMethod?: 'app' | 'sms' | 'call';
  }) {
    try {
      const notificationData = {
        userId: data.userId,
        type: data.type,
        message: data.message,
        data: data.data || {},
        deviceId: data.deviceId,
        importanceLevel: data.importanceLevel || 'medium',
        notificationMethod: data.notificationMethod || 'app',
        deliveryStatus: 'pending' as const,
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
    deliveryMethod: 'app' | 'sms' | 'call';
    targetNumber?: string;
    status?: 'pending' | 'sent' | 'delivered' | 'failed';
  }) {
    try {
      const deliveryLogData = {
        notificationId: data.notificationId,
        deliveryMethod: data.deliveryMethod,
        targetNumber: data.targetNumber || '',
        status: data.status || 'pending',
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
    status: 'pending' | 'sent' | 'delivered' | 'failed'
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
    status: 'pending' | 'sent' | 'delivered' | 'failed',
    errorMessage?: string,
    retryCount?: number,
    additionalData?: {
      aliYunMsgId?: string;
      maxDeliveryTime?: Date;
    }
  ): Promise<void> {
    try {
      const updateData: Record<string, unknown> = {
        status,
      };

      if (errorMessage !== undefined) {
        updateData.errorMessage = errorMessage;
      }

      if (status === 'delivered' || status === 'failed') {
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
      this.logger.error(`更新通知发送记录状态失败: ${error.message}`, error.stack);
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
            eq(notificationLogs.status, 'sent'),
            eq(notificationLogs.deliveryMethod, 'sms'),
            isNotNull(notificationLogs.aliYunMsgId)
          ),
      });

      return logs;
    } catch (error) {
      this.logger.error(`查找待处理的短信发送记录失败: ${error.message}`, error.stack);
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
      this.logger.error(`根据阿里云消息ID查找发送记录失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 根据通知ID查找发送记录
   */
  async findDeliveryLogsByNotificationId(notificationId: string) {
    try {
      const logs = await this.db.query.notificationDeliveryLogs.findMany({
        where: eq(schema.notificationDeliveryLogs.notificationId, notificationId),
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
}