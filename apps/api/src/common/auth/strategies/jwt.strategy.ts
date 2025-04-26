import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { DB } from '../../../database/database.provider';

/**
 * JWT令牌载荷类型
 */
export interface JwtPayload {
  userId: string;
  // 客户端name为手机号，管理端端为名称字符串(如: root)
  name: string;
  nikeName?: string;
  iat?: number;
  exp?: number;
  isRefreshToken?: boolean;
  type: 'admin' | 'user';
  roles?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(DB) private readonly db: DbType,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      secretOrKey: config.JWT_SECRET,
      passReqToCallback: true,
    });
  }

  /**
   * JWT策略验证方法
   * @param req 请求对象
   * @param payload JWT载荷
   * @returns 验证后的用户信息
   */
  async validate(req: Request, payload: JwtPayload) {
    try {
      let userOrAdmin;

      // 检查 payload 中是否包含必要的类型信息
      if (!payload.type) {
        this.throwUnauthorized('无效的 Token (缺少用户类型)');
      }

      // 根据类型查询不同的表
      if (payload.type === 'admin') {
        if (!payload.userId) {
          this.throwUnauthorized('无效的管理员 Token (缺少 ID)');
        }
        const result = await this.db.query.adminUsers.findFirst({
          where: (field, { eq }) => eq(field.id, payload.userId),
          with: {
            userRoles: {
              columns: {},
              with: {
                role: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        });
        const roles = result?.userRoles.map((roles) => roles.role.name) || [];
        userOrAdmin = {
          ...result,
          roles,
        };
      } else if (payload.type === 'user') {
        if (!payload.name) {
          this.throwUnauthorized('无效的用户 Token (缺少用户手机号)');
        }
        const result = await this.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.phone, payload.name)) // 使用 phone 查询用户
          .limit(1);
        userOrAdmin = result[0];
      } else {
        // 类型不匹配
        this.throwUnauthorized('无效的 Token (未知的用户类型)');
      }

      // 检查用户是否存在
      if (!userOrAdmin) {
        this.throwUnauthorized('用户不存在或 Token 无效');
      }

      // 将用户信息（包含原始 payload 以便访问 type 等）设置到请求对象中
      // 注意：req.user 的类型现在可能是 User 或 AdminUser
      // 后续的守卫或逻辑需要处理这种可能性
      // 将 payload 和 数据库实体分开存储，避免覆盖数据库中的字段
      const user = {
        ...payload,
        ...userOrAdmin,
      };

      // 返回从数据库查询到的用户/管理员对象
      return user;
    } catch (error) {
      // 如果是已知授权错误，直接抛出
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // 其他未知错误或数据库查询错误，也视为授权失败
      // 可以在这里添加日志记录 error
      console.error('JWT Validation Error:', error);
      this.throwUnauthorized(error);
    }
  }

  // 辅助方法抛出异常，避免重复代码
  private throwUnauthorized(message: string): never {
    throw new UnauthorizedException(message);
  }
}
