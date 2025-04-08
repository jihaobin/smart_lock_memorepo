import { Module } from '@nestjs/common';

import { AppNotificationGateway } from './app-notification.gateway';

@Module({
  providers: [AppNotificationGateway],
  exports: [AppNotificationGateway],
})
export class AppNotificationModule {}
