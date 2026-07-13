import { serverEnvSchema } from '../definitions/server';
import { resolveDeprecatedAliases } from './aliases';
import { parseClientEnv } from './client';

describe('environment contract', () => {
  it('转换端口并应用默认值', () => {
    const parsed = serverEnvSchema.partial().parse({ PORT: '3100' });
    expect(parsed.PORT).toBe(3100);
  });

  it('只解析两个 Expo 公共 URL', () => {
    expect(
      parseClientEnv({
        EXPO_PUBLIC_API_URL: 'http://localhost:3000/api',
        EXPO_PUBLIC_SOCKET_URL: 'http://localhost:3000',
      })
    ).toEqual({
      apiUrl: 'http://localhost:3000/api',
      socketUrl: 'http://localhost:3000',
    });
  });

  it('新变量优先于旧别名并发出弃用警告', () => {
    const warnings: string[] = [];
    const result = resolveDeprecatedAliases(
      { PORT: '3001', API_PORT: '3000' },
      { PORT: ['API_PORT'] },
      warning => warnings.push(warning)
    );
    expect(result.PORT).toBe('3001');
    expect(warnings).toContain('[deprecated] API_PORT: 请迁移为 PORT');
  });

  it('生产客户端拒绝 localhost 默认值', () => {
    expect(() => parseClientEnv({}, { production: true })).toThrow('不能指向 localhost');
  });
});
