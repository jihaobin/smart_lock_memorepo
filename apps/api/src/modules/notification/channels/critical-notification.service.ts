import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common';

import { NotificationRepository } from '../notification.repository';
import { AppNotificationService } from './app-notification.service';
import { CallNotificationService } from './call-notification.service';
import { SmsNotificationService } from './sms-notification.service';

@Injectable()
export class CriticalNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly appNotificationService: AppNotificationService,
    private readonly smsNotificationService: SmsNotificationService,
    private readonly callNotificationService: CallNotificationService,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext(CriticalNotificationService.name);
  }

  /**
   * 发送紧急通知 (关键优先级)
   * 同时使用多个渠道发送通知
   */
  async sendNotification(notificationData: {
    notificationId: string;
    userId: string;
    type: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    this.logger.log(`开始发送紧急通知: ${notificationData.notificationId}`);

    // 用于跟踪各通知渠道的结果
    const results = {
      app: { success: false, error: null },
      sms: { success: false, error: null },
      call: { success: false, error: null },
    };

    // 记录总体是否成功
    let overallSuccess = false;

    try {
      // 1. 创建一个主发送记录 - 系统限制只能使用预定义的渠道类型
      const mainLog = await this.notificationRepository.createDeliveryLog({
        notificationId: notificationData.notificationId,
        deliveryMethod: 'app', // 使用app类型但实际是多渠道紧急通知
        status: 'pending',
      });

      this.logger.log(`创建紧急通知主记录(ID: ${mainLog.id})，准备通过多渠道发送`);

      // 2. 同时尝试使用所有渠道发送通知
      // 为防止一个渠道失败影响其他渠道，使用Promise.allSettled
      await Promise.allSettled([
        // 应用内通知
        this.appNotificationService.sendNotification(notificationData)
          .then(() => { results.app.success = true; })
          .catch(err => { results.app.error = err.message; }),

        // 短信通知
        this.smsNotificationService.sendNotification(notificationData)
          .then(() => { results.sms.success = true; })
          .catch(err => { results.sms.error = err.message; }),

        // 电话通知
        this.callNotificationService.sendNotification(notificationData)
          .then(() => { results.call.success = true; })
          .catch(err => { results.call.error = err.message; }),
      ]);

      // 3. 检查总体结果
      // 如果至少有一个渠道成功，就认为通知已送达
      overallSuccess = results.app.success || results.sms.success || results.call.success;

      // 4. 更新通知状态
      const finalStatus = overallSuccess ? 'delivered' : 'failed';
      await this.notificationRepository.updateNotificationStatus(
        notificationData.notificationId,
        finalStatus
      );

      // 记录结果
      this.logger.log(`紧急通知发送结果: ${JSON.stringify(results)}`);

      if (overallSuccess) {
        this.logger.log(`紧急通知至少通过一个渠道成功发送: ${notificationData.notificationId}`);
        return true;
      } else {
        this.logger.error(`紧急通知所有渠道均发送失败: ${notificationData.notificationId}`);
        throw new Error('所有通知渠道均发送失败');
      }
    } catch (error) {
      this.logger.error(
        `发送紧急通知时发生错误: ${error.message}`,
        error.stack
      );

      // 如果前面的处理逻辑有问题，确保更新通知状态为失败
      if (!overallSuccess) {
        await this.notificationRepository.updateNotificationStatus(
          notificationData.notificationId,
          'failed'
        );
      }

      throw error;
    }
  }
}