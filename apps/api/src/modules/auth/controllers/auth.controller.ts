import { Body, Controller, Post, UsePipes } from '@nestjs/common';
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
import { ZodBody } from 'src/common';
import { Public } from 'src/common/auth/jwt-auth.guard';

import { ZodValidationPipe } from '../../../common/pipes';
import { AuthService } from '../services/auth.service';

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
    return {
      message: '注册成功',
      data: result,
    };
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录成功的用户信息和令牌
   */
  @Public()
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() loginDto: LoginSchemaType) {
    const result = await this.authService.login(loginDto);
    return {
      message: '登录成功',
      data: result,
    };
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
    // 这里应该有发送重置密码邮件的逻辑，暂不实现
    return {
      message: '重置密码邮件已发送',
      data: { email: forgotPasswordDto.email },
    };
  }

  /**
   * 发送验证码
   * @param verifyCodeDto 验证码信息
   * @returns 验证码发送结果
   */
  @Public()
  @Post('verify-code')
  @ZodBody(VerifyCodeSchema)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeSchemaType) {
    const result = await this.authService.sendVerifyCode(verifyCodeDto.email);
    return {
      message: '验证码发送成功',
      data: result,
    };
  }
}
