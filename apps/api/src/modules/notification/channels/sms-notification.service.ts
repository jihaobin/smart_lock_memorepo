import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addMinutes } from 'date-fns';
import { AppLoggerService } from 'src/common';
import { SmsService } from 'src/common/sms';

import { NotificationRepository } from '../notification.repository';

/**
 * 通知数据接口
 */
interface NotificationData {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class SmsNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly smsService: SmsService,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext(SmsNotificationService.name);
  }

  /**
   * 发送短信通知 (中等优先级)
   */
  async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      this.logger.log(`发送短信通知: ${notificationData.notificationId}`);

      // 检查是否是重试发送
      const existingLogs = await this.notificationRepository.findDeliveryLogsByNotificationId(
        notificationData.notificationId
      );

      const retryCount = existingLogs.filter(log => log.deliveryMethod === 'sms').length;

      if (retryCount > 0) {
        this.logger.log(`短信通知重试: ${notificationData.notificationId}, 第${retryCount + 1}次尝试`);
      }

      // 获取用户手机号
      const userPhone = await this.notificationRepository.getUserPhone(notificationData.userId);

      if (!userPhone) {
        throw new Error(`用户 ${notificationData.userId} 没有绑定手机号`);
      }

      // 创建发送记录，初始状态为发送中
      const deliveryLog = await this.notificationRepository.createDeliveryLog({
        notificationId: notificationData.notificationId,
        deliveryMethod: 'sms',
        targetNumber: userPhone,
        status: 'pending',
      });

      // 设置最大等待送达时间（30分钟后）
      const maxDeliveryTime = addMinutes(new Date(), 30);

      try {
        // 调用短信服务发送通知
        const smsResult = await this.smsService.sendSms(
          userPhone,
          this.formatSmsMessage(notificationData.message, notificationData.type)
        );

        if (smsResult && smsResult.success) {
          // 保存阿里云消息ID和最大等待时间
          await this.notificationRepository.updateDeliveryLogStatus(
            deliveryLog.id,
            'sent',  // 状态更新为"已发送"但尚未确认送达
            undefined,
            0,
            {
              aliYunMsgId: smsResult.messageId,
              maxDeliveryTime
            }
          );

          // 立即查询一次状态（有些消息可能很快就送达了）
          await this.checkMessageStatus(deliveryLog.id, smsResult.messageId || "", userPhone);

          this.logger.log(`短信通知已发送: ${deliveryLog.id}, 阿里云消息ID: ${smsResult.messageId}`);
          return true;
        } else {
          throw new Error('短信服务未返回有效的消息ID');
        }
      } catch (error) {
        // 发送失败，记录错误
        await this.notificationRepository.updateDeliveryLogStatus(
          deliveryLog.id,
          'failed',
          error.message
        );
        throw error;
      }
    } catch (error) {
      this.logger.error(
        `发送短信通知失败: ${error.message}`,
        error.stack
      );

      // 尝试更新发送记录状态为失败
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
          // 创建一条失败的记录
          await this.notificationRepository.createDeliveryLog({
            notificationId: notificationData.notificationId,
            deliveryMethod: 'sms',
            status: 'failed',
          });
        }
      } catch (logError) {
        this.logger.error(`记录短信发送失败状态时出错: ${logError.message}`, logError.stack);
      }

      // 继续抛出错误，让队列重试
      throw error;
    }
  }

  /**
   * 根据阿里云消息ID检查消息状态
   */
  private async checkMessageStatus(logId: string, messageId: string, phone: string): Promise<void> {
    try {
      const statusResult = await this.smsService.querySmsStatus(messageId, phone);

      if (statusResult.success) {
        if (statusResult.status === 'delivered') {
          // 短信已送达
          await this.notificationRepository.updateDeliveryLogStatus(
            logId,
            'delivered'
          );
          this.logger.log(`短信通知已送达: ${logId}, 阿里云消息ID: ${messageId}`);
        } else if (statusResult.status === 'failed') {
          // 短信发送失败
          await this.notificationRepository.updateDeliveryLogStatus(
            logId,
            'failed',
            statusResult.errorCode || '发送失败'
          );
          this.logger.warn(`短信通知发送失败: ${logId}, 阿里云消息ID: ${messageId}, 错误: ${statusResult.errorCode || '未知错误'}`);
        }
        // 如果状态是pending，保持当前状态，等待后续检查
      }
    } catch (error) {
      this.logger.error(`检查短信状态失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 定时检查待处理的短信状态
   * 每5分钟执行一次
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingSmsStatus(): Promise<void> {
    try {
      this.logger.log('开始检查待处理的短信状态');

      // 获取所有状态为"已发送但未确认送达"的短信记录
      const pendingLogs = await this.notificationRepository.findPendingSmsDeliveryLogs();

      if (pendingLogs.length === 0) {
        return;
      }

      this.logger.log(`找到 ${pendingLogs.length} 条待检查的短信记录`);

      // 遍历并检查每条记录
      for (const log of pendingLogs) {
        // 类型安全检查
        if (!log.aliYunMsgId || !log.targetNumber) {
          continue;
        }

        // 检查是否已超过最大等待时间
        const now = new Date();
        if (log.maxDeliveryTime && new Date(log.maxDeliveryTime) < now) {
          // 已超时，标记为失败
          await this.notificationRepository.updateDeliveryLogStatus(
            log.id,
            'failed',
            '送达超时'
          );
          this.logger.warn(`短信通知送达超时: ${log.id}, 阿里云消息ID: ${log.aliYunMsgId}`);
        } else {
          // 未超时，检查当前状态
          await this.checkMessageStatus(log.id, log.aliYunMsgId, log.targetNumber);
        }
      }

      this.logger.log('短信状态检查完成');
    } catch (error) {
      this.logger.error(`定时检查短信状态失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 格式化短信内容
   */
  private formatSmsMessage(message: string, type: string): number {
    // 根据不同类型的通知，格式化成合适的短信内容
    // 这里可以根据实际业务需求定制
    switch (type) {
      case 'doorbell':
        // return `门铃提醒：${message}`;
        return 1112;
      case 'device_open_alert':
        // return `未关门提醒：${message}`;
        return 1113;
      case 'device_low_battery':
        // return `设备电量低：${message}`;
        return 1114;
      case 'device_broken':
        // return `设备异常警告：${message}`;
        return 1115;
      default:
        // return `智能锁通知：${message}`;
        return 1116;
    }
  }
}