import {
  APP_CONFIG,
  type AppConfig,
  createAppConfigProvider,
} from './config.provider';

describe('createAppConfigProvider', () => {
  it('将加载器返回的对象注册为 APP_CONFIG', () => {
    const expected = { PORT: 3000, JWT_SECRET: 'a'.repeat(64) } as AppConfig;
    const provider = createAppConfigProvider(() => expected);
    expect(provider.provide).toBe(APP_CONFIG);
    expect(provider.useValue).toBe(expected);
  });
});
