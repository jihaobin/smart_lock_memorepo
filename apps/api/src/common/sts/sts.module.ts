import { Module } from '@nestjs/common';

import { STSController } from './sts.controller';
import { STSService } from './sts.service';
import { JwtSharedModule } from '../auth/jwt-shared.module';

@Module({
  imports: [
    JwtSharedModule,
  ],
  controllers: [STSController],
  providers: [STSService],
  exports: [STSService],
})
export class STSModule {}