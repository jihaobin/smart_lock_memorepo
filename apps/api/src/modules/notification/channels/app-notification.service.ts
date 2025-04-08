import { Injectable} from '@nestjs/common';
import { IAppNotificationMessage } from '@smart-lock/shared/';
import { AppLoggerService } from 'src/common';

import { NotificationRepository } from '../notification.repository';
import { AppNotificationGateway } from './app-notification/app-notification.gateway';

@Injectable()
export class AppNotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly logger: AppLoggerService,
    private readonly appNotificationGateway: AppNotificationGateway
  ) {
    this.logger.setContext(AppNotificationService.name)
  }

  /**
   * 发送应用内通知 (低优先级)
   * 这里仅写入数据库，实际推送操作需要结合推送服务或WebSocket实现
   */
  async sendNotification(notificationData:IAppNotificationMessage): Promise<boolean> {
    try {
      this.logger.log(`发送应用内通知: ${notificationData.notificationId}`);

      // 创建通知发送记录
      const deliveryLog = await this.notificationRepository.createDeliveryLog({
        notificationId: notificationData.notificationId,
        deliveryMethod: 'app',
        status: 'delivered', // 应用内通知直接标记为已送达
      });

      this.logger.log(`应用内通知发送成功: ${deliveryLog.id}`);

      // 通过WebSocket发送实时通知
      // 使用用户ID作为房间ID，确保通知只发送给特定用户
      this.appNotificationGateway.sendNotification(notificationData.userId, notificationData);
      this.logger.log(`WebSocket通知已发送至用户: ${notificationData.userId}`);

      return true;
    } catch (error) {
      this.logger.error(
        `发送应用内通知失败: ${error.message}`,
        error.stack
      );
      // 记录发送失败
      await this.notificationRepository.updateDeliveryLogStatus(
        notificationData.notificationId,
        'failed',
        error.message
      );
      throw error;
    }
  }
}