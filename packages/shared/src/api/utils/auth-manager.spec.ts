import { AuthManager } from './auth-manager';

describe('AuthManager public paths', () => {
  const authManager = new AuthManager();

  it.each([
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/send_verification_code',
  ])('allows unauthenticated requests to %s', path => {
    expect(authManager.isProtectedPath(path)).toBe(false);
  });

  it.each(['/device/list', '/auth/login-history'])('keeps %s protected', path => {
    expect(authManager.isProtectedPath(path)).toBe(true);
  });
});
