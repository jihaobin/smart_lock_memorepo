import { Global, Module } from '@nestjs/common';

import { APP_CONFIG, createAppConfigProvider } from './config.provider';

@Global()
@Module({
  providers: [createAppConfigProvider()],
  exports: [APP_CONFIG],
})
export default class ConfigModule {}
