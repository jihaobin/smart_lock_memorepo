import { Module } from '@nestjs/common';
import { AppLoggerService } from 'src/common';
import { UnLockRecordService } from 'src/modules/unLockRecord/unLockRecord.service';

import { DeviceGateway } from './device.gateway';
import { MobileGateway } from './mobile.gateway';
import { DeviceRepository } from '../device.repository';
import { DeviceService } from '../device.service';
import { DeviceRedisService } from '../services/device-redis.service';
import { DeviceStatusService } from '../services/device-status.service';

@Module({
  providers: [
    DeviceGateway,
    MobileGateway,
    DeviceService,
    DeviceRepository,
    DeviceRedisService,
    DeviceStatusService,
    UnLockRecordService,
    AppLoggerService,
  ],
  exports: [DeviceGateway, MobileGateway],
})
export class DeviceGatewayModule {}
