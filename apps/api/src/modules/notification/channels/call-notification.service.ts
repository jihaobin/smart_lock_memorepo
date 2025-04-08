import { Injectable } from '@nestjs/common';
import { AppLoggerService } from 'src/common';

import { NotificationRepository } from '../notification.repository';

@Injectable()
export class CallNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext(CallNotificationService.name);
  }

  /**
   * 发送电话通知 (高优先级)
   * 注意：此为示例实现，实际电话通知功能需要对接第三方服务
   */
  async sendNotification(notificationData: {
    notificationId: string;
    userId: string;
    type: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<boolean> {
    try {
      this.logger.log(`发送电话通知: ${notificationData.notificationId}`);

      // 获取用户手机号
      const userPhone = await this.notificationRepository.getUserPhone(notificationData.userId);

      if (!userPhone) {
        throw new Error(`用户 ${notificationData.userId} 没有绑定手机号`);
      }

      // 创建发送记录
      const deliveryLog = await this.notificationRepository.createDeliveryLog({
        notificationId: notificationData.notificationId,
        deliveryMethod: 'call',
        targetNumber: userPhone,
        status: 'pending',
      });

      // 模拟电话通知发送
      // 实际应调用三方服务或自建呼叫系统
      this.logger.log(`模拟电话通知到 ${userPhone}: ${notificationData.message}`);

      // TODO: 实现电话通知功能，例如：
      // await this.callService.makeCall({
      //   phoneNumber: userPhone,
      //   message: notificationData.message,
      //   type: notificationData.type
      // });

      // 假设通知成功
      await this.notificationRepository.updateDeliveryLogStatus(
        deliveryLog.id,
        'delivered'
      );

      this.logger.log(`电话通知发送成功: ${deliveryLog.id}`);
      return true;
    } catch (error) {
      this.logger.error(
        `发送电话通知失败: ${error.message}`,
        error.stack
      );

      // 更新错误状态
      try {
        // 查询该通知的发送记录
        const records = await this.notificationRepository.findDeliveryLogsByNotificationId(
          notificationData.notificationId
        );

        if (records && records.length > 0) {
          // 更新最后一条记录为失败
          await this.notificationRepository.updateDeliveryLogStatus(
            records[records.length - 1].id,
            'failed',
            error.message
          );
        } else {
          // 创建一条失败记录
          await this.notificationRepository.createDeliveryLog({
            notificationId: notificationData.notificationId,
            deliveryMethod: 'call',
            status: 'failed',
          });
        }
      } catch (logError) {
        this.logger.error(`记录电话通知失败状态时出错: ${logError.message}`, logError.stack);
      }

      throw error; // 重新抛出错误以触发重试
    }
  }
}