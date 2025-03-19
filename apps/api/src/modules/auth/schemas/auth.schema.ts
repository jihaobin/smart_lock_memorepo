/**
 * JWT令牌载荷类型
 */
export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * 认证响应类型
 */
export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    nikeName: string;
  };
}
