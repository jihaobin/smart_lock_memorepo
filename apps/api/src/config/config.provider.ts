import type { JwtModuleOptions } from '@nestjs/jwt';
import { loadServerEnv, type ServerEnv } from '@smart-lock/env/server';

export const APP_CONFIG = Symbol('APP_CONFIG');
export type AppConfig = Omit<ServerEnv, 'JWT_EXPIRES_IN'> & {
  JWT_EXPIRES_IN: NonNullable<
    NonNullable<JwtModuleOptions['signOptions']>['expiresIn']
  >;
};

export function createAppConfigProvider(
  loader: () => ServerEnv | AppConfig = loadServerEnv,
) {
  return {
    provide: APP_CONFIG,
    useValue: loader() as AppConfig,
  };
}
