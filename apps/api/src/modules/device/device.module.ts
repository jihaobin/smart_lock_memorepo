import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DeviceController } from './device.controller';
import { DeviceRepository } from './device.repository';
import { DeviceService } from './device.service';
import { DeviceGatewayModule } from './gateways/device-gateway.module';
import { DeviceGateway } from './gateways/device.gateway';
import { MobileGateway } from './gateways/mobile.gateway';
import { DeviceStatusQueueService } from './queues/device-status-queue.service';
import { DeviceStatusProcessor } from './queues/device-status.processor';
import { DeviceRedisService } from './services/device-redis.service';
import { DeviceStatusService } from './services/device-status.service';
import { UnLockRecordService } from '../unLockRecord/unLockRecord.service';

@Module({
  imports: [
    DeviceGatewayModule,
    // 注册设备状态队列
    BullModule.registerQueue({
      name: 'device-status-queue',
      defaultJobOptions: {
        attempts: 3, // 最多重试3次
        backoff: {
          type: 'exponential', // 指数级退避策略
          delay: 5000, // 初始延迟5秒
        },
        removeOnComplete: true, // 完成后移除作业
        removeOnFail: false, // 失败后不移除，便于排查问题
      },
    }),
  ],
  controllers: [DeviceController],
  providers: [
    DeviceService,
    DeviceRepository,
    DeviceGateway,
    MobileGateway,
    // 新增的服务
    DeviceStatusService,
    DeviceStatusQueueService,
    DeviceStatusProcessor,
    DeviceRedisService,
    UnLockRecordService,
  ],
  exports: [
    DeviceService,
    DeviceRepository,
    DeviceGateway,
    MobileGateway,
    DeviceStatusService,
    DeviceRedisService,
  ],
})
export class DeviceModule {}
