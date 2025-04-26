import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ErrorCode,
  AdminLoginSchemaType,
  AdminCreateSchemaType,
  AdminAuthResponse,
} from '@smart-lock/shared';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import ms, { StringValue } from 'ms';
import { JwtPayload } from 'src/common/auth/strategies/jwt.strategy';
import { ValidationException } from 'src/common/exceptions';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { AdminAuthRepository } from './admin-auth.repository';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class AdminAuthService {
  private readonly expires_in: number;
  private readonly refresh_expires_in: number;

  constructor(
    private readonly adminAuthRepository: AdminAuthRepository,
    private readonly jwtService: JwtService,
    private readonly rbacService: RbacService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    // 设置令牌过期时间
    this.expires_in =
      new Date().getTime() + ms(this.config.JWT_EXPIRES_IN as StringValue);
    // 刷新令牌的过期时间，默认设置为访问令牌的10倍
    this.refresh_expires_in =
      new Date().getTime() + ms(this.config.JWT_EXPIRES_IN as StringValue) * 10;
  }

  /**
   * 生成访问令牌和刷新令牌
   * @param payload JWT负载
   * @returns 包含访问令牌和刷新令牌的对象
   */
  private generateTokens(payload: JwtPayload): {
    access_token: string;
    refresh_token: string;
  } {
    const access_token = this.jwtService.sign(payload, {
      expiresIn: this.config.JWT_EXPIRES_IN,
    });

    const refresh_token = this.jwtService.sign(
      { ...payload, isRefreshToken: true },
      {
        expiresIn: ms(this.config.JWT_EXPIRES_IN as StringValue) * 10,
      },
    );

    return { access_token, refresh_token };
  }

  /**
   * 验证用户
   * @param name 用户名
   * @param password 密码
   * @returns 验证通过的用户信息（不含密码）
   */
  async validateUser(name: string, password: string) {
    // 验证必需字段
    if (!name || !password) {
      throw new ValidationException('缺少必需字段', ErrorCode.VALIDATION_ERROR);
    }

    const user = await this.adminAuthRepository.findUserByName(name);
    if (!user) {
      return null;
    }

    const isPasswordValid = await this.adminAuthRepository.validatePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      return null;
    }

    // 不返回密码哈希
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录成功的用户信息和令牌
   */
  async login(loginDto: AdminLoginSchemaType): Promise<AdminAuthResponse> {
    // 验证必需字段
    if (!loginDto.name || !loginDto.password) {
      throw new ValidationException('缺少必需字段', ErrorCode.VALIDATION_ERROR);
    }

    // 查找用户
    const user = await this.adminAuthRepository.findUserByName(loginDto.name);
    if (!user) {
      throw new BadRequestException('用户名或密码错误');
    }

    // 验证密码
    const isPasswordValid = await this.adminAuthRepository.validatePassword(
      loginDto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('用户名或密码错误');
    }

    // 获取用户角色
    const roles = await this.rbacService.getUserRoles(user.id);

    // 获取用户可访问的路由
    const accessibleRoutes = await this.rbacService.getUserAccessibleRoutes(
      user.id,
    );

    // 生成JWT令牌
    const payload: JwtPayload = {
      userId: user.id,
      name: user.name,
      roles: roles.map((role) => role.name),
      type: 'admin',
    };

    const { access_token, refresh_token } = this.generateTokens(payload);

    // 返回登录成功的响应
    return {
      access_token,
      refresh_token,
      expires_in: this.expires_in,
      user: {
        id: user.id,
        name: user.name,
        roles,
        accessibleRoutes,
      },
    };
  }

  /**
   * 刷新令牌
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌和刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<AdminAuthResponse> {
    // 验证刷新令牌参数
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new BadRequestException('无效的刷新令牌格式');
    }

    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshToken);

      // 检查是否是刷新令牌
      if (!payload.isRefreshToken) {
        throw new ForbiddenException('提供的令牌不是有效的刷新令牌');
      }

      // 检查是否有必要的字段
      if (!payload.sub || !payload.username) {
        throw new UnauthorizedException('令牌缺少必要的用户信息');
      }

      // 查找用户
      const user = await this.adminAuthRepository.findUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('用户不存在或已被删除');
      }

      // 获取用户角色
      const roles = await this.rbacService.getUserRoles(user.id);

      // 获取用户可访问的路由
      const accessibleRoutes = await this.rbacService.getUserAccessibleRoutes(
        user.id,
      );

      // 生成新的令牌
      const newPayload: JwtPayload = {
        userId: user.id,
        name: user.name,
        roles: roles.map((role) => role.name),
        type: 'admin',
      };

      const { access_token, refresh_token } = this.generateTokens(newPayload);

      // 返回新的令牌
      return {
        access_token,
        refresh_token,
        expires_in: this.expires_in,
        user: {
          id: user.id,
          name: user.name,
          roles,
          accessibleRoutes,
        },
      };
    } catch (error) {
      // 区分不同类型的JWT错误
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('刷新令牌已过期，请重新登录');
      } else if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('刷新令牌无效，格式错误或签名无效');
      } else if (
        error instanceof ForbiddenException ||
        error instanceof UnauthorizedException
      ) {
        // 直接抛出已经创建的异常
        throw error;
      } else {
        // 其他未预期的错误
        throw new UnauthorizedException('刷新令牌验证失败');
      }
    }
  }

  /**
   * 创建管理员用户（仅限管理员使用）
   * @param userData 用户数据
   * @returns 创建的用户信息（不含密码）
   */
  async createUser(userData: AdminCreateSchemaType) {
    // 验证必需字段
    if (!userData.name || !userData.password || !userData.confirmPassword) {
      throw new ValidationException('缺少必需字段', ErrorCode.VALIDATION_ERROR);
    }

    // 检查两次密码是否一致
    if (userData.password !== userData.confirmPassword) {
      throw new ValidationException(
        '两次输入的密码不一致',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // 检查用户名是否已存在
    const existingUser = await this.adminAuthRepository.findUserByName(
      userData.name,
    );
    if (existingUser) {
      throw new ConflictException('该用户名已被使用');
    }

    // 对密码进行加密
    const passwordHash = await this.adminAuthRepository.hashPassword(
      userData.password,
    );

    // 创建用户
    const newUser = await this.adminAuthRepository.createUser({
      name: userData.name,
      passwordHash,
    });

    // 如果有指定角色，分配角色
    if (userData.roleIds && userData.roleIds.length > 0) {
      await this.rbacService.assignRolesToUser(newUser.id, userData.roleIds);
    }

    // 获取用户角色
    const roles = await this.rbacService.getUserRoles(newUser.id);

    // 不返回密码哈希
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = newUser;
    return {
      ...result,
      roles,
    };
  }

  /**
   * 修改密码
   * @param userId 用户ID
   * @param currentPassword 当前密码
   * @param newPassword 新密码
   * @returns 更新后的用户信息（不含密码）
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.adminAuthRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证当前密码
    const isPasswordValid = await this.adminAuthRepository.validatePassword(
      currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('当前密码不正确');
    }

    // 哈希新密码
    const newPasswordHash =
      await this.adminAuthRepository.hashPassword(newPassword);

    // 更新密码
    const updatedUser = await this.adminAuthRepository.updateUserPassword(
      userId,
      newPasswordHash,
    );

    // 不返回密码哈希
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  /**
   * 获取用户个人资料
   * @param userId 用户ID
   * @returns 用户信息和角色
   */
  async getUserProfile(userId: string) {
    const user = await this.adminAuthRepository.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 获取用户角色
    const roles = await this.rbacService.getUserRoles(user.id);

    // 不返回密码哈希
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return {
      ...result,
      roles,
    };
  }
}
