import { loadServerEnv } from './server';

describe('loadServerEnv', () => {
  it('将空的可选 URL 视为未配置', () => {
    const env = loadServerEnv({
      source: {
        NEXT_PUBLIC_APP_URL: '',
        JWT_SECRET: 'virtual-secret-value-that-is-at-least-32-characters',
        DATABASE_PASSWORD: 'virtual-database-password',
        DATABASE_URL: 'postgresql://user:password@localhost:5432/smart_lock',
        MAIL_HOST: 'smtp.example.com',
        MAIL_PORT: '465',
        MAIL_USER: 'virtual-user',
        MAIL_PASS: 'virtual-password',
        MAIL_FROM_NAME: 'Smart Lock',
        ALIYUN_ACCESS_KEY_ID: 'virtual-access-key-id',
        ALIYUN_ACCESS_KEY_SECRET: 'virtual-access-key-secret',
        ALIYUN_SMS_SIGN_NAME: 'virtual-sign-name',
        ALIYUN_SMS_TEMPLATE_CODE: 'virtual-template-code',
        ALIYUN_STS_ROLE_ARN: 'acs:ram::1234567890123456:role/virtual-role',
        SUPER_ADMIN_USERNAME: 'root',
        SUPER_ADMIN_PASSWORD: 'virtual-admin-password',
        DEBUG_KEY: 'virtual-debug-key',
        EXPO_PUBLIC_API_URL: 'http://localhost:3000',
      },
      loadDotEnv: false,
    });

    expect(env.NEXT_PUBLIC_APP_URL).toBeUndefined();
  });

  it('一次报告全部错误且不包含秘密实际值', () => {
    let message = '';
    try {
      loadServerEnv({
        source: { JWT_SECRET: 'short-secret-value' },
        loadDotEnv: false,
      });
    } catch (error) {
      message = String(error);
    }

    expect(message).toContain('JWT_SECRET');
    expect(message).toContain('DATABASE_PASSWORD');
    expect(message).not.toContain('short-secret-value');
  });
});
