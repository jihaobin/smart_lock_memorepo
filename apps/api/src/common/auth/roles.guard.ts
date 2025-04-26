import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 获取路由或控制器上设置的所需角色
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有设置角色要求，则默认允许访问
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 获取请求对象和用户信息
    const request = context.switchToHttp().getRequest<Request>();
    console.log(request.user);
    const user = request.user;

    // 如果没有用户信息或角色信息，则拒绝访问
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('您没有访问此资源的权限');
    }

    // 检查用户是否拥有所需角色中的任意一个
    const hasRequiredRole = requiredRoles.some((role) =>
      user.roles?.includes(role),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        '您没有权限执行此操作，需要以下角色之一: ' + requiredRoles.join(', '),
      );
    }

    return true;
  }
}
