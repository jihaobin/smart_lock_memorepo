import { Module } from '@nestjs/common';

import { TemporaryPasswordController } from './temporary-password.controller';
import { TemporaryPasswordService } from './temporary-password.service';

@Module({
  controllers: [TemporaryPasswordController],
  providers: [TemporaryPasswordService],
})
export class TemporaryPasswordModule {}
