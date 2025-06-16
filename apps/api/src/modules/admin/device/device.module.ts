import { Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { DeviceRepository } from './device.repository';
import { DeviceModelModule } from '../../device/deviceModel/deviceModel.module';

@Module({
  imports: [DeviceModelModule],
  controllers: [DeviceController],
  providers: [DeviceService, DeviceRepository],
  exports: [DeviceService, DeviceRepository],
})
export class DeviceModule {}
