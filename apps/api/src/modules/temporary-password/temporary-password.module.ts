import { Module } from '@nestjs/common';
import { TemporaryPasswordService } from './temporary-password.service';
import { TemporaryPasswordController } from './temporary-password.controller';

@Module({
  controllers: [TemporaryPasswordController],
  providers: [TemporaryPasswordService],
})
export class TemporaryPasswordModule {}
