import { Module, Inject } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtSharedModule } from 'src/common/auth/jwt-shared.module';
import { MailModule } from 'src/common/mail/main.module';
import { SmsModule } from 'src/common/sms/sms.module';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    MailModule,
    SmsModule,
    JwtSharedModule, // 导入共享模块而不是 JwtModule
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService, PassportModule], // 不再需要导出 JwtModule
})
export class AuthModule {
  constructor(@Inject(APP_CONFIG) private config: AppConfig) {}
}
