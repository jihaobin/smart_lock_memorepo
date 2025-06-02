import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_ENUM } from '@smart-lock/shared';
import { Job } from 'bullmq';
import { AppLoggerService } from 'src/common';

import { UnLockRecordService } from '../../unLockRecord/unLockRecord.service';
import { AppNotificationService } from '../channels/app-notification.service';
import { CallNotificationService } from '../channels/call-notification.service';
import { CriticalNotificationService } from '../channels/critical-notification.service';
import { SmsNotificationService } from '../channels/sms-notification.service';
import { retryConfig } from '../config';
import { NotificationRepository } from '../notification.repository';

@Injectable()
@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  constructor(
    @Inject(NotificationRepository)
    private readonly notificationRepository: NotificationRepository,

    @Inject(AppNotificationService)
    private readonly appNotificationService: AppNotificationService,

    @Inject(SmsNotificationService)
    private readonly smsNotificationService: SmsNotificationService,

    @Inject(CallNotificationService)
    private readonly callNotificationService: CallNotificationService,

    @Inject(CriticalNotificationService)
    private readonly criticalNotificationService: CriticalNotificationService,

    @Inject(UnLockRecordService)
    private readonly unLockRecordService: UnLockRecordService,

    private readonly logger: AppLoggerService,
  ) {
    super();
    this.logger.setContext(NotificationProcessor.name);
  }

  /**
   * 处理通知作业
   */
  async process(job: Job) {
    this.logger.log(`开始处理通知: ${job.id}`);

    try {
      const data = job.data;
      this.logger.debug(`处理通知任务: ${JSON.stringify(data)}`);

      // 如果是开门通知，添加开锁记录
      if (data.type === NOTIFICATION_ENUM.DEVICE_OPEN && data.deviceId) {
        try {
          // 创建开锁记录
          const unlockResult =
            await this.unLockRecordService.createUnlockRecord({
              deviceId: data.deviceId,
              userId: data.userId,
              unlockType: data.data.openType,
              ...data.data,
            });
          this.logger.log(`已为开门通知创建开锁记录: ${unlockResult.id}`);
        } catch (unlockError) {
          // 记录错误但不中断通知处理流程
          this.logger.error(
            `创建开锁记录失败: ${unlockError.message}`,
            unlockError.stack,
          );
        }
      }

      // 记录处理开始
      const startTime = Date.now();

      // 根据通知重要级别选择不同的通知渠道
      switch (data.importanceLevel) {
        case 'critical':
          // 紧急通知 - 使用所有渠道并优先处理
          await this.criticalNotificationService.sendNotification(data);
          break;

        case 'high':
          // 高优先级 - 电话通知
          await this.callNotificationService.sendNotification(data);
          break;

        case 'medium':
          // 中等优先级 - 短信通知
          await this.smsNotificationService.sendNotification(data);
          break;

        case 'low':
        default:
          // 低优先级 - 应用内通知
          await this.appNotificationService.sendNotification(data);
          break;
      }

      // 计算处理时间
      const processingTime = Date.now() - startTime;

      // 更新通知状态为已发送
      await this.notificationRepository.updateNotificationStatus(
        data.notificationId,
        'delivered',
      );

      this.logger.log(
        `通知处理成功: ${data.notificationId}, 处理时间: ${processingTime}ms`,
      );

      return {
        success: true,
        notificationId: data.notificationId,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`处理通知失败: ${error.message}`, error.stack);

      // 重新抛出错误，触发重试机制
      throw error;
    }
  }

  /**
   * 当作业完成时的处理
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`通知任务完成: ${job.id}`);
  }

  /**
   * 当作业失败时的处理
   */
  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `通知任务失败: ${job.id}, 错误: ${error.message}`,
      error.stack,
    );

    try {
      // 获取当前尝试次数和配置的最大尝试次数
      const { importanceLevel, notificationId } = job.data;
      const maxRetries = retryConfig[importanceLevel]?.maxRetries || 3;
      const attempts = job.attemptsMade;

      this.logger.log(
        `通知重试情况: 当前第${attempts}次尝试, 最大${maxRetries}次`,
      );

      // 如果达到最大重试次数，标记为最终失败
      if (attempts >= maxRetries) {
        this.logger.warn(
          `通知 ${notificationId} 达到最大重试次数(${maxRetries}), 标记为失败`,
        );

        await this.notificationRepository.updateNotificationStatus(
          notificationId,
          'failed',
        );

        // 对于高优先级和关键通知，需要考虑电话升级机制
        if (
          (importanceLevel === 'high' || importanceLevel === 'critical') &&
          retryConfig[importanceLevel].useCallEscalation
        ) {
          this.logger.warn(
            `关键通知 ${notificationId} 发送失败, 开始电话升级流程`,
          );
          // 这里实际应该调用电话升级服务，记录升级事件等
        }
      } else {
        // 记录重试次数
        await this.notificationRepository.updateNotificationStatus(
          notificationId,
          'pending',
        );
      }
    } catch (logError) {
      this.logger.error(
        `记录通知失败信息出错: ${logError.message}`,
        logError.stack,
      );
    }
  }
}
