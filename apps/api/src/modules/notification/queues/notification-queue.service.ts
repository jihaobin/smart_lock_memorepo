import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { AppLoggerService } from 'src/common';

import { retryConfig } from '../config';

/**
 * 通知队列参数接口
 */
export interface NotificationJobData {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  deviceId?: string;
  data?: Record<string, unknown>;
  importanceLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 通知队列选项接口
 */
export interface NotificationJobOptions {
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
  priority?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
  jobId?: string;
}

@Injectable()
export class NotificationQueueService {
  constructor(
    @InjectQueue('notification-queue')
    private readonly notificationQueue: Queue,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext(NotificationQueueService.name);
  }

  /**
   * 向队列中添加通知作业
   * @param notificationData 通知数据
   * @param jobOptions 作业选项
   */
  async addNotificationJob(
    notificationData: NotificationJobData,
    jobOptions?: NotificationJobOptions
  ) {
    try {
      // 根据重要程度设置优先级
      // 1是最高优先级，100是最低优先级
      const priorityMap: Record<string, number> = {
        'critical': 1,  // 紧急情况，最高优先级
        'high': 25,     // 高优先级
        'medium': 50,   // 中等优先级
        'low': 90       // 低优先级
      };

      // 获取配置的重试次数，如果未指定则使用默认值
      const configRetry = retryConfig[notificationData.importanceLevel];
      const attempts = jobOptions?.attempts || configRetry?.maxRetries || 3;
      const retryDelay = jobOptions?.backoff?.delay || configRetry?.baseRetryInterval || 5000;

      // 生成作业ID，如果没有提供
      const jobId = jobOptions?.jobId || `notification:${notificationData.notificationId}`;

      // 添加到队列
      const job = await this.notificationQueue.add(
        'process-notification',
        notificationData,
        {
          // 默认作业选项
          attempts,
          backoff: jobOptions?.backoff || {
            type: 'exponential',
            delay: retryDelay,
          },
          priority: jobOptions?.priority || priorityMap[notificationData.importanceLevel],
          removeOnComplete: jobOptions?.removeOnComplete !== undefined ? jobOptions.removeOnComplete : true,
          removeOnFail: jobOptions?.removeOnFail !== undefined ? jobOptions.removeOnFail : false,
          jobId,
        } as JobsOptions
      );

      this.logger.log(`通知作业已添加到队列: ${job.id}, 优先级: ${priorityMap[notificationData.importanceLevel]}, 重试次数: ${attempts}`);
      return job;
    } catch (error) {
      this.logger.error(`添加通知作业到队列失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 根据通知ID移除通知作业
   */
  async removeNotificationJob(jobId: string) {
    try {
      await this.notificationQueue.remove(jobId);
      this.logger.log(`通知作业已从队列移除: ${jobId}`);
    } catch (error) {
      this.logger.error(`从队列移除通知作业失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取指定作业的状态
   */
  async getJobStatus(jobId: string) {
    try {
      const job = await this.notificationQueue.getJob(jobId);
      if (!job) {
        return null;
      }

      const state = await job.getState();
      return {
        id: job.id,
        state,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      this.logger.error(`获取通知作业状态失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}