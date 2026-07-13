import { createClientEnv } from './env';

describe('clientEnv', () => {
  it('映射 API 和 Socket URL', () => {
    expect(
      createClientEnv(
        {
          EXPO_PUBLIC_API_URL: 'http://localhost:3000/api',
          EXPO_PUBLIC_SOCKET_URL: 'http://localhost:3000',
        },
        false
      )
    ).toEqual({
      apiUrl: 'http://localhost:3000/api',
      socketUrl: 'http://localhost:3000',
    });
  });
});
