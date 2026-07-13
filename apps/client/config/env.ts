import { parseClientEnv } from '@smart-lock/env/client';

export const createClientEnv = (source: Record<string, string | undefined>, production: boolean) =>
  parseClientEnv(source, { production });

export const clientEnv = createClientEnv(
  {
    EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
    EXPO_PUBLIC_SOCKET_URL: process.env.EXPO_PUBLIC_SOCKET_URL,
    EXPO_PUBLIC_NOTICATION: process.env.EXPO_PUBLIC_NOTICATION,
  },
  !__DEV__
);
