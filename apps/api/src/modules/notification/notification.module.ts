import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SmsModule } from 'src/common/sms';

import { UnLockRecordService } from '../unLockRecord/unLockRecord.service';
// 导入通知服务
import { AppNotificationModule } from './channels/app-notification/app-notification.module';
import { AppNotificationService } from './channels/app-notification.service';
import { CallNotificationService } from './channels/call-notification.service';
import { CriticalNotificationService } from './channels/critical-notification.service';
import { SmsNotificationService } from './channels/sms-notification.service';
import { CallbackController } from './controllers/callback.controller';
import { NotificationController } from './notification.controller';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
// 导入队列相关服务
import { NotificationQueueService } from './queues/notification-queue.service';
import { NotificationProcessor } from './queues/notification.processor';

// 导入各通知渠道服务

@Module({
  imports: [
    // 注册通知队列
    BullModule.registerQueue({
      name: 'notification-queue',
      defaultJobOptions: {
        attempts: 3, // 默认重试3次
        backoff: {
          type: 'exponential', // 指数级退避策略
          delay: 5000, // 初始延迟5秒
        },
        removeOnComplete: true, // 完成后移除作业
        removeOnFail: false, // 失败后不移除作业，便于排查问题
      },
    }),
    SmsModule, // 导入短信模块
    AppNotificationModule, // 导入WebSocket通知模块
  ],
  controllers: [NotificationController, CallbackController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationQueueService,
    NotificationProcessor,
    AppNotificationService,
    SmsNotificationService,
    CallNotificationService,
    CriticalNotificationService,
    UnLockRecordService,
  ],
  exports: [NotificationService, NotificationQueueService],
})
export class NotificationModule {}
