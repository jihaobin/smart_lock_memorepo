jest.mock('@smart-lock/env/server', () => {
  const actual = jest.requireActual('@smart-lock/env/server');
  return {
    ...actual,
    loadServerEnv: () => ({
      NODE_ENV: 'test',
      PORT: 3000,
      DEBUG_KEY: 'virtual-debug-key-for-tests',
      DATABASE_USER: 'test_user',
      DATABASE_PASSWORD: 'virtual-database-password',
      DATABASE_NAME: 'test_database',
      DATABASE_URL: 'postgresql://test_user:virtual@localhost:5432/test_database',
      JWT_SECRET: 'virtual-jwt-secret-for-tests-00000000000000000000000000000000',
      JWT_EXPIRES_IN: '1d',
      MAIL_HOST: 'mail.test.invalid',
      MAIL_PORT: 1025,
      MAIL_USER: 'test-user',
      MAIL_PASS: 'virtual-mail-password',
      MAIL_FROM_NAME: 'Test Mailer',
      ALIYUN_ACCESS_KEY_ID: 'virtual-access-key-id',
      ALIYUN_ACCESS_KEY_SECRET: 'virtual-access-key-secret',
      ALIYUN_SMS_SIGN_NAME: 'test-sign',
      ALIYUN_SMS_TEMPLATE_CODE: 'test-template',
      ALIYUN_STS_ROLE_ARN: 'acs:ram::000000000000:role/test',
      ALIYUN_STS_ROLE_SESSION_NAME: 'SmartLockTest',
      ALIYUN_STS_POLICY: '',
      ALIYUN_STS_DURATION_SECONDS: 3600,
      SUPER_ADMIN_USERNAME: 'test-admin',
      SUPER_ADMIN_PASSWORD: 'virtual-admin-password',
    }),
  };
});
