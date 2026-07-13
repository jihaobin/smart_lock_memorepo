import { clientEnvSchema } from '../definitions/client';
import { resolveDeprecatedAliases } from './aliases';

export function parseClientEnv(input: Record<string, string | undefined>, options: { production?: boolean } = {}) {
  const resolved = resolveDeprecatedAliases(input, { EXPO_PUBLIC_SOCKET_URL: ['EXPO_PUBLIC_NOTICATION'] });
  const parsed = clientEnvSchema.parse(resolved);
  if (options.production && Object.values(parsed).some(value => value.includes('localhost'))) {
    throw new Error('[invalid] 生产环境客户端 URL 不能指向 localhost');
  }
  return { apiUrl: parsed.EXPO_PUBLIC_API_URL, socketUrl: parsed.EXPO_PUBLIC_SOCKET_URL };
}
