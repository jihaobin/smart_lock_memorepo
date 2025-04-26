import { Module } from '@nestjs/common';

import { FriendController } from './friend.controller';
import { FriendRepository } from './friend.repository';
import { FriendService } from './friend.service';

@Module({
  controllers: [FriendController],
  providers: [FriendService, FriendRepository],
})
export class FriendModule {}
