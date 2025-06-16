import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { AdminAuthModule } from './auth/admin-auth.module';
import { RbacModule } from './rbac/rbac.module';
import { AdminUserModule } from './adminUser/adminUser.module';
import { UserModule } from './user/user.module';
import { DeviceModelModule } from '../device/deviceModel/deviceModel.module';
import { DeviceModule } from './device/device.module';

@Module({
  imports: [
    // 管理后台的各个功能模块
    AdminAuthModule,
    RbacModule,
    AdminUserModule,
    UserModule,
    DeviceModelModule,
    RouterModule.register([
      {
        path: 'admin',
        children: [
          AdminAuthModule,
          RbacModule,
          AdminUserModule,
          UserModule,
          DeviceModelModule,
          DeviceModule,
        ],
      },
    ]),
    DeviceModule,
  ],
  exports: [
    AdminAuthModule,
    RbacModule,
    AdminUserModule,
    UserModule,
    DeviceModelModule,
    DeviceModule,
  ],
})
export class AdminModule {}
