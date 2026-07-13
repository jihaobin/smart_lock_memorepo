import { loadServerEnv, type ServerEnv } from '@smart-lock/env/server';
import type ms = require('ms');

export const APP_CONFIG = Symbol('APP_CONFIG');
export type AppConfig = Omit<ServerEnv, 'JWT_EXPIRES_IN'> & {
  JWT_EXPIRES_IN: ms.StringValue;
};

export function createAppConfigProvider(
  loader: () => ServerEnv = loadServerEnv,
) {
  return {
    provide: APP_CONFIG,
    useValue: loader() as AppConfig,
  };
}
