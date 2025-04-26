import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  SetMetadata,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import type { Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { JwtPayload } from './strategies/jwt.strategy';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

declare module 'express' {
  interface Request {
    user: JwtPayload;
  }
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @Inject(APP_CONFIG) private readonly configService: AppConfig,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // 检查路由是否标记为公开
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果路由标记为公开，则允许访问
    if (isPublic) {
      return true;
    }

    // 尝试从请求头解析JWT并设置到请求上下文
    this.extractAndSetJwtToRequest(context);

    // 执行JWT验证
    return super.canActivate(context);
  }

  handleRequest<TUser extends JwtPayload>(
    err: Error | null,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    // 处理验证错误
    if (err || !user) {
      throw err || new UnauthorizedException('未授权访问');
    }

    // 将用户信息设置到请求对象中
    const request = context.switchToHttp().getRequest<Request>();
    request.user = user;

    return user;
  }

  private extractAndSetJwtToRequest(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);

        const decoded = this.jwtService.verify<JwtPayload>(token, {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          secret: this.configService.JWT_SECRET as string,
        });

        // 将解码后的JWT信息设置到请求上下文中

        request.user = decoded;
      } catch {
        // 解析失败时不抛出异常，让后续的验证流程处理
      }
    }
  }
}
