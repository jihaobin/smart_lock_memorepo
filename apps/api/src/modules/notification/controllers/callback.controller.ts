import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppLoggerService, SkipTransform } from 'src/common';
import { Public } from 'src/common/auth/jwt-auth.guard';

import { DeliveryLogType } from '../dto/notification.dto';
import { NotificationRepository } from '../notification.repository';
import { NotificationQueueService } from '../queues/notification-queue.service';

/**
 * 短信回调数据接口
 */
interface SmsCallbackData {
  send_time: string;      // 转发给运营商的时间
  report_time: string;    // 收到运营商回执的时间
  success: boolean;       // 是否发送成功
  err_msg: string;        // 错误信息描述
  err_code: string;       // 错误码
  phone_number: string;   // 短信接收号码
  sms_size: string;       // 短信长度
  biz_id: string;         // 发送回执ID
  out_id: string;         // SendSms接口传入的outId
}


// https://543444jnnk93.vicp.fun/notifications/callback/sms-status
/**
 * 短信状态回调控制器
 * 用于接收阿里云关于短信送达状态的回调通知
 */

@Controller('notifications/callback')
export class CallbackController {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly notificationQueueService: NotificationQueueService,
    private readonly logger: AppLoggerService
  ) {
    this.logger.setContext(CallbackController.name);
  }

  /**
   * 阿里云短信状态回调接口
   * 接收阿里云推送的短信送达状态回调
   */
  @Public()
  @SkipTransform()
  @Post('sms-status')
  async receiveSmsStatusCallback(
    @Body() dataArray: SmsCallbackData[],
    @Res() response: Response
  ) {
    try {
      this.logger.log(`收到短信状态回调: ${JSON.stringify(dataArray)}`);

      // 处理每一条回执信息
      for (const data of dataArray) {
        const { biz_id, success, err_code, err_msg, phone_number } = data;

        if (!biz_id) {
          this.logger.warn('回调数据缺少消息ID(biz_id)');
          continue; // 跳过这条记录，继续处理其他记录
        }

        // 根据消息ID查找对应的发送记录
        const deliveryLogs = await this.notificationRepository.findDeliveryLogByAliYunMsgId(biz_id);

        if (!deliveryLogs || deliveryLogs.length === 0) {
          this.logger.warn(`未找到消息ID为 ${biz_id} 的发送记录`);
          continue; // 跳过这条记录，继续处理其他记录
        }

        const log = deliveryLogs[0];

        // 根据回调结果更新记录状态
        if (success) {
          // 成功送达
          await this.notificationRepository.updateDeliveryLogStatus(
            log.id,
            'delivered'
          );
          this.logger.log(`短信送达成功: ${log.id}, 阿里云消息ID: ${biz_id}`);
        } else {
          // 送达失败，记录错误信息
          await this.notificationRepository.updateDeliveryLogStatus(
            log.id,
            'failed',
            `短信发送失败: ${err_code} - ${err_msg}`
          );
          this.logger.warn(`短信送达失败: ${log.id}, 阿里云消息ID: ${biz_id}, 错误码: ${err_code}, 错误: ${err_msg}`);

          // 获取通知数据，准备重试
          await this.handleFailedSms(log as DeliveryLogType, phone_number);
        }
      }

      response
        .status(200)
        .header('Content-Type', 'application/json;charset=UTF-8')
        .send('{"code":0,"msg":"接收成功"}');
    } catch (error) {
      this.logger.error(`处理短信状态回调失败: ${error.message}`, error.stack);
      response
        .status(200) // 即使出错也返回200状态码
        .header('Content-Type', 'application/json;charset=UTF-8')
        .send('{"code":1,"msg":"处理失败"}');
    }
  }

  /**
   * 处理短信发送失败的情况，进行重试
   */
  private async handleFailedSms(log: DeliveryLogType, _phoneNumber: string) {
    try {
      // 获取原始通知信息
      const notification = await this.notificationRepository.findNotificationById(log.notificationId);
      if (!notification) {
        this.logger.warn(`无法重试短信，找不到通知记录: ${log.notificationId}`);
        return;
      }

      // 检查重试次数是否超过上限
      const deliveryLogs = await this.notificationRepository.findDeliveryLogsByNotificationId(notification.id);
      const smsRetryCount = deliveryLogs.filter(l => l.deliveryMethod === 'sms').length;

      // 最多重试3次
      if (smsRetryCount >= 3) {
        this.logger.warn(`短信通知 ${notification.id} 已达最大重试次数(${smsRetryCount})，不再重试`);
        return;
      }

      // 添加到队列中重新发送
      this.logger.log(`准备重新发送短信通知: ${notification.id}, 重试次数: ${smsRetryCount + 1}`);

      await this.notificationQueueService.addNotificationJob(
        {
          notificationId: notification.id,
          userId: notification.userId,
          type: notification.type,
          message: notification.message,
          data: notification.data || {},
          deviceId: notification.deviceId ?? undefined,
          importanceLevel: notification.importanceLevel as 'low' | 'medium' | 'high' | 'critical',
        },
        {
          attempts: 1, // 每次只尝试1次，失败后由回调处理
          priority: 40, // 较高优先级，但不要太高影响其他通知
          jobId: `notification:retry:${notification.id}:${smsRetryCount + 1}` // 唯一ID避免重复
        }
      );

    } catch (error) {
      this.logger.error(`处理短信失败重试逻辑出错: ${error.message}`, error.stack);
    }
  }
}