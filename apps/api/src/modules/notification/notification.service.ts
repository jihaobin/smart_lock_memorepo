import { Injectable } from '@nestjs/common';
import { NOTIFICATION_ENUM, IMPORTANCE_LEVEL } from '@smart-lock/shared';
import { AppLoggerService } from 'src/common';

import { notificationLevel, retryConfig } from './config';
import { CreateNotificationDto } from './dto/notification.dto';
import { NotificationRepository } from './notification.repository';
import { NotificationQueueService } from './queues/notification-queue.service';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationQueueService: NotificationQueueService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(NotificationQueueService.name);
  }

  /**
   * 创建并发送通知
   */
  async createAndSendNotification(createDto: CreateNotificationDto) {
    try {
      this.logger.log(`创建通知: ${JSON.stringify(createDto)}`);

      // 确定通知重要性级别（如果未指定，则从配置中获取）
      const importanceLevel = (createDto.importanceLevel ||
        notificationLevel[createDto.type as keyof typeof notificationLevel] ||
        'medium') as 'low' | 'medium' | 'high' | 'critical';

      // 1. 创建通知记录到数据库
      const notification = await this.notificationRepository.createNotification(
        {
          userId: createDto.userId!,
          type: createDto.type as (typeof NOTIFICATION_ENUM)[keyof typeof NOTIFICATION_ENUM],
          message: createDto.message!,
          data: createDto.data || {},
          deviceId: createDto.deviceId,
          importanceLevel: importanceLevel,
          notificationMethod: createDto.notificationMethod,
        },
      );

      // 获取此重要性级别的重试配置
      const retryOptions = retryConfig[importanceLevel];

      // 2. 添加到通知队列，使用配置中的重试策略
      const job = await this.notificationQueueService.addNotificationJob(
        {
          notificationId: notification.id,
          userId: notification.userId,
          type: notification.type,
          message: notification.message,
          data: notification.data || {},
          deviceId: notification.deviceId || undefined,
          importanceLevel: importanceLevel,
        },
        {
          // 使用配置中的重试次数
          attempts: retryOptions.maxRetries,
          backoff: {
            type: 'exponential',
            delay: retryOptions.baseRetryInterval,
          },
        },
      );

      this.logger.log(
        `通知已创建并加入队列: ${notification.id}, 作业ID: ${job.id}, 重要性: ${importanceLevel}, 最大重试次数: ${retryOptions.maxRetries}`,
      );

      return {
        id: notification.id,
        status: 'pending',
        jobId: job.id,
        importanceLevel,
      };
    } catch (error) {
      this.logger.error(`创建通知失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取通知状态
   */
  async getNotificationStatus(notificationId: string) {
    try {
      // 从数据库中查询通知
      const notification =
        await this.notificationRepository.findNotificationById(notificationId);

      if (!notification) {
        throw new Error(`通知不存在: ${notificationId}`);
      }

      // 获取作业状态
      const jobStatus = await this.notificationQueueService.getJobStatus(
        `notification:${notificationId}`,
      );

      // 获取该通知的所有发送记录
      const deliveryLogs =
        await this.notificationRepository.findDeliveryLogsByNotificationId(
          notificationId,
        );

      return {
        id: notification.id,
        status: notification.deliveryStatus,
        jobStatus: jobStatus ? jobStatus.state : null,
        importanceLevel: notification.importanceLevel,
        deliveryLogs: deliveryLogs.map((log) => ({
          id: log.id,
          method: log.deliveryMethod,
          status: log.status,
          createdAt: log.attemptTime,
          completedAt: log.completionTime,
          retryCount: log.retryCount,
        })),
      };
    } catch (error) {
      this.logger.error(`获取通知状态失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(params: {
    userId: string;
    page: number;
    limit: number;
    type?: (typeof NOTIFICATION_ENUM)[keyof typeof NOTIFICATION_ENUM];
    deviceId?: string;
    importanceLevel?: (typeof IMPORTANCE_LEVEL)[keyof typeof IMPORTANCE_LEVEL];
    fromDate?: string;
    toDate?: string;
  }) {
    try {
      this.logger.log(`获取用户通知列表: ${JSON.stringify(params)}`);

      // 调用仓库方法获取通知列表
      const result =
        await this.notificationRepository.findNotificationsByUserId(
          params.userId,
          params.page,
          params.limit,
          {
            type: params.type,
            deviceId: params.deviceId,
            importanceLevel: params.importanceLevel,
            fromDate: params.fromDate,
            toDate: params.toDate,
          },
        );
      return result;
    } catch (error) {
      this.logger.error(`获取用户通知列表失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
