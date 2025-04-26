import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { AdminAuthModule } from './auth/admin-auth.module';
import { RbacModule } from './rbac/rbac.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    // 管理后台的各个功能模块
    AdminAuthModule,
    RbacModule,
    UserModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [AdminAuthModule, RbacModule, UserModule],
      },
    ]),
  ],
  exports: [AdminAuthModule, RbacModule, UserModule],
})
export class AdminModule {}
