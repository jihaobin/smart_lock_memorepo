import { Module } from '@nestjs/common';

import { UnLockRecordController } from './unLockeRecord.controller';
import { UnLockRecordService } from './unLockRecord.service';

@Module({
  controllers: [UnLockRecordController],
  providers: [UnLockRecordService],
})
export class UnLockRecordModule {}
