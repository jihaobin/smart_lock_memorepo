import { loadServerEnv } from './server';

describe('loadServerEnv', () => {
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
