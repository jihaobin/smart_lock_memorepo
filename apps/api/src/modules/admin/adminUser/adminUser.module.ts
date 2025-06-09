import { Module } from '@nestjs/common';
import { AuthRepository } from 'src/modules/auth/repositories/auth.repository';

import { AdminUserController } from './adminUser.controller';
import { AdminUserRepository } from './adminUser.repository';
import { AdminUserService } from './adminUser.service';
import { AdminAuthRepository } from '../auth/admin-auth.repository';

@Module({
  controllers: [AdminUserController],
  providers: [
    AdminUserService,
    AuthRepository,
    AdminUserRepository,
    AdminAuthRepository,
  ],
})
export class AdminUserModule {}
