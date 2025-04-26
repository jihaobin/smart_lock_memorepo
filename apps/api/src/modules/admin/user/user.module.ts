import { Module } from '@nestjs/common';
import { AuthRepository } from 'src/modules/auth/repositories/auth.repository';
import { AdminAuthRepository } from '../auth/admin-auth.repository';

import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthRepository, UserRepository, AdminAuthRepository],
})
export class UserModule {}
