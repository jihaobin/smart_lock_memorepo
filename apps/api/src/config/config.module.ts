import { Global, Module } from '@nestjs/common';

import { APP_CONFIG, envSchema } from './config.provider';

@Global()
@Module({
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => {
        const env = process.env;
        const config = envSchema.parse(env);
        return config;
      },
    },
  ],
  exports: [APP_CONFIG],
})
export default class ConfigModule {}
