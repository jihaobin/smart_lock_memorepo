import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  UsePipes,
} from '@nestjs/common';
import {
  AdminLoginSchema,
  AdminLoginSchemaType,
  AdminChangePasswordSchema,
  AdminChangePasswordSchemaType,
  AdminCreateSchema,
  AdminCreateSchemaType,
} from '@smart-lock/shared';
import { JwtAuthGuard, Public } from 'src/common/auth/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/common/auth/roles.guard';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

import { AdminAuthService } from './admin-auth.service';

@Controller('auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  /**
   * 管理员登录
   * @param loginDto 登录信息
   * @returns 登录成功的用户信息和令牌
   */
  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(AdminLoginSchema))
  async login(@Body() loginDto: AdminLoginSchemaType) {
    return this.adminAuthService.login(loginDto);
  }

  /**
   * 刷新令牌
   * @param refreshTokenDto 刷新令牌
   * @returns 新的访问令牌和刷新令牌
   */
  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: { refreshToken: string }) {
    return this.adminAuthService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * 创建子用户（仅限管理员角色使用）
   * @param createUserDto 用户创建信息
   * @returns 创建的用户信息
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('users')
  @UsePipes(new ZodValidationPipe(AdminCreateSchema))
  async createUser(@Body() createUserDto: AdminCreateSchemaType) {
    return this.adminAuthService.createUser(createUserDto);
  }

  /**
   * 修改密码
   * @param req 请求对象
   * @param passwordDto 密码修改信息
   * @returns 更新后的用户信息
   */
  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @UsePipes(new ZodValidationPipe(AdminChangePasswordSchema))
  async changePassword(
    @Request() req,
    @Body() passwordDto: AdminChangePasswordSchemaType,
  ) {
    return this.adminAuthService.changePassword(
      req.user.userId,
      passwordDto.currentPassword ?? '',
      passwordDto.newPassword ?? '',
    );
  }

  /**
   * 获取用户个人资料
   * @param req 请求对象
   * @returns 用户信息和角色
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return this.adminAuthService.getUserProfile(req.user.userId);
  }
}
