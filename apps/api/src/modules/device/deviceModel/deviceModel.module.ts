import { Module } from '@nestjs/common';

import { DeviceModelController } from './deviceModel.controller';
import { DeviceModelRepository } from './deviceModel.repository';
import { DeviceModelService } from './deviceModel.service';

@Module({
  controllers: [DeviceModelController],
  providers: [DeviceModelService, DeviceModelRepository],
  exports: [DeviceModelService, DeviceModelRepository],
})
export class DeviceModelModule {}
