/**
 * JWT令牌载荷类型
 */
export interface JwtPayload {
  sub: string;
  phone: string;
  iat?: number;
  exp?: number;
  isRefreshToken?: boolean;
}
