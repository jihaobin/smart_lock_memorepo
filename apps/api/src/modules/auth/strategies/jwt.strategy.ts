import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq } from 'drizzle-orm';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { DB } from '../../../database/database.provider';
import { JwtPayload } from '../schemas/auth.schema';

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
      // 直接使用数据库查询，避免循环依赖
      const result = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.phone, payload.phone))
        .limit(1);

      const user = result[0];

      if (!user) {
        throw new UnauthorizedException('未授权');
      }

      // 将用户信息设置到请求对象中
      req.user = {
        ...payload,
        ...user,
      };

      return user;
    } catch {
      throw new UnauthorizedException('Token无效或已过期');
    }
  }
}
