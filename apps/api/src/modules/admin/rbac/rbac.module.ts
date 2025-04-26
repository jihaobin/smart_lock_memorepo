import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { RbacController } from './rbac.controller';
import { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';
import { AdminAuthRepository } from '../auth/admin-auth.repository';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.JWT_SECRET,
        signOptions: { expiresIn: config.JWT_EXPIRES_IN },
      }),
    }),
  ],
  controllers: [RbacController],
  providers: [RbacService, RbacRepository, AdminAuthRepository],
  exports: [RbacService, JwtModule, RbacRepository],
})
export class RbacModule {}
