import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  ForgotPasswordSchema,
  ForgotPasswordSchemaType,
  LoginSchema,
  LoginSchemaType,
  RegisterSchema,
  RegisterSchemaType,
  VerifyCodeSchema,
  VerifyCodeSchemaType,
} from '@smart-lock/shared';
import { createZodDto } from 'nestjs-zod';
import { ZodBody } from 'src/common';
import { Public } from 'src/common/auth/jwt-auth.guard';
import { z } from 'zod';

import { ZodValidationPipe } from '../../../common/pipes';
import { AuthService } from '../services/auth.service';

// 刷新令牌请求模式
const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, '刷新令牌不能为空'),
});

type RefreshTokenSchemaType = z.infer<typeof RefreshTokenSchema>;

export class LoginDto extends createZodDto(LoginSchema) {}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 用户注册
   * @param registerDto 注册信息
   * @returns 注册成功的用户信息和令牌
   */
  @Public()
  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() registerDto: RegisterSchemaType) {
    const result = await this.authService.register(registerDto);
    return result;
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录成功的用户信息和令牌
   */
  @ApiOperation({
    summary: '用户登录',
    description: '用户通过手机号和密码登录系统',
  }) // 添加 API 操作的摘要
  @ApiBody({ type: LoginDto }) // 指定请求体的 DTO 类型
  @ApiResponse({ status: 201 }) // 添加成功响应信息
  @ApiResponse({ status: 400 }) // 添加错误响应信息，根据实际需要添加更多
  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() loginDto: LoginSchemaType) {
    const result = await this.authService.login(loginDto);
    return result;
  }

  /**
   * 刷新访问令牌
   * @param refreshTokenDto 刷新令牌信息
   * @returns 新的访问令牌和刷新令牌
   */
  @Public()
  @Post('refresh-token')
  @UsePipes(new ZodValidationPipe(RefreshTokenSchema))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenSchemaType) {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refreshToken,
    );
    return result;
  }

  /**
   * 忘记密码 - 请求重置
   * @param forgotPasswordDto 忘记密码信息
   * @returns 重置密码的结果
   */
  @Public()
  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordSchemaType) {
    // 使用手机号发送重置密码短信验证码
    return {
      message: '重置密码验证码已发送到您的手机',
      data: { phone: forgotPasswordDto.phone },
    };
  }

  /**
   * 发送验证码
   * @param verifyCodeDto 验证码信息
   * @returns 验证码发送结果
   */
  @Public()
  @Post('send_verification_code')
  @ZodBody(VerifyCodeSchema)
  async sendVerificationCode(@Body() verifyCodeDto: VerifyCodeSchemaType) {
    const result = await this.authService.sendVerifyCode(
      verifyCodeDto.phone,
      verifyCodeDto.biz,
    );
    return result;
  }
}
