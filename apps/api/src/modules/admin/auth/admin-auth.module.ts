import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthRepository } from './admin-auth.repository';
import { AdminAuthService } from './admin-auth.service';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
    JwtModule.registerAsync({
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.JWT_SECRET,
        signOptions: {
          expiresIn: config.JWT_EXPIRES_IN,
        },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthRepository],
  exports: [AdminAuthService, AdminAuthRepository, JwtModule],
})
export class AdminAuthModule {}
