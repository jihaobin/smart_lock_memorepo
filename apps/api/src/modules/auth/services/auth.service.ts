import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ErrorCode,
  IAuthResponse,
  LoginSchemaType,
  RegisterSchemaType,
} from '@smart-lock/shared';
import * as argon2 from 'argon2';
import ms, { StringValue } from 'ms';
import { JwtPayload } from 'src/common/auth/strategies/jwt.strategy';
import { SmsService } from 'src/common/sms/sms.service';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { ValidationException } from '../../../common/exceptions';
import { AuthRepository } from '../repositories/auth.repository';

@Injectable()
export class AuthService {
  private readonly expires_in: number;
  private readonly refresh_expires_in: number;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.expires_in =
      new Date().getTime() + ms(this.config.JWT_EXPIRES_IN as StringValue);
    // 刷新令牌的过期时间，默认设置为访问令牌的10倍
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      expiresIn: this.config.JWT_EXPIRES_IN,
    });

    const refresh_token = this.jwtService.sign(
      { ...payload, isRefreshToken: true },
      {
        // 刷新令牌的过期时间比访问令牌长10倍
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expiresIn: ms(this.config.JWT_EXPIRES_IN as StringValue) * 10,
      },
    );

    return { access_token, refresh_token };
  }

  /**
   * 注册新用户
   * @param registerDto 注册信息
   * @returns 注册成功的用户信息和令牌
   */
  async register(registerDto: RegisterSchemaType): Promise<IAuthResponse> {
    // 验证必需字段
    if (
      !registerDto.phone ||
      !registerDto.password ||
      !registerDto.verificationCode ||
      !registerDto.nikeName
    ) {
      throw new ValidationException('缺少必需字段', ErrorCode.VALIDATION_ERROR);
    }

    // 检查两次密码是否一致
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new ValidationException(
        '两次输入的密码不一致',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // 检查手机号是否已被注册
    const existingUser = await this.authRepository.findUserByPhone(
      registerDto.phone,
    );
    if (existingUser) {
      throw new ConflictException('该手机号已被注册');
    }

    // 检查短信验证码
    const verificationCode = await this.smsService.verifyCode({
      phone: registerDto.phone,
      code: registerDto.verificationCode,
      biz: 'register',
    });
    if (!verificationCode) {
      throw new ValidationException('验证码错误', ErrorCode.VALIDATION_ERROR);
    }

    // 对密码进行加密
    const passwordHash = await argon2.hash(registerDto.password);

    // 创建用户
    const user = await this.authRepository.createUser(
      registerDto,
      passwordHash,
    );

    // 生成JWT令牌
    const payload: JwtPayload = {
      userId: user.id,
      name: user.phone,
      type: 'user',
    };

    const { access_token, refresh_token } = this.generateTokens(payload);

    // 返回登录成功的响应
    return {
      access_token,
      refresh_token,
      expires_in: this.expires_in,
      user: {
        id: user.id,
        phone: user.phone,
        nikeName: user.nikeName,
      },
    };
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录成功的用户信息和令牌
   */
  async login(loginDto: LoginSchemaType): Promise<IAuthResponse> {
    // 验证必需字段
    if (!loginDto.phone || !loginDto.password) {
      throw new ValidationException('缺少必需字段', ErrorCode.VALIDATION_ERROR);
    }

    // 查找用户
    const user = await this.authRepository.findUserByPhone(loginDto.phone);
    if (!user) {
      throw new BadRequestException('手机号或密码错误');
    }

    // 验证密码
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('手机号或密码错误');
    }

    // 生成JWT令牌
    const payload: JwtPayload = {
      userId: user.id,
      name: user.phone,
      type: 'user',
    };

    const { access_token, refresh_token } = this.generateTokens(payload);

    // 返回登录成功的响应
    return {
      access_token,
      refresh_token,
      expires_in: this.expires_in,
      user: {
        id: user.id,
        phone: user.phone,
        nikeName: user.nikeName,
      },
    };
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌和刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<IAuthResponse> {
    try {
      // 验证刷新令牌
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(refreshToken, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        secret: this.config.JWT_SECRET,
      });

      // 确保这是一个刷新令牌
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!payload.isRefreshToken) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // 查找用户
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const user = await this.authRepository.findUserByPhone(payload.phone);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }

      // 生成新的令牌
      const newPayload: JwtPayload = {
        userId: user.id,
        name: user.phone,
        type: 'user',
      };

      const { access_token, refresh_token } = this.generateTokens(newPayload);

      // 返回新的令牌
      return {
        access_token,
        refresh_token,
        expires_in: this.expires_in,
        user: {
          id: user.id,
          phone: user.phone,
          nikeName: user.nikeName,
        },
      };
    } catch {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 验证用户
   * @param payload JWT负载
   * @returns 验证成功的用户信息
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.authRepository.findUserByPhone(payload.name);
    if (!user) {
      throw new UnauthorizedException('未授权');
    }

    return user;
  }

  /**
   * 发送验证码
   * @param phone 手机号
   * @param biz 业务类型
   * @param codeLength 验证码长度
   * @param expires 验证码有效期(分钟)
   * @returns 验证码
   */
  async sendVerifyCode(
    phone?: string,
    biz: string = 'register',
    codeLength?: number,
    expires?: number,
  ) {
    try {
      if (!phone) {
        throw new BadRequestException('请提供手机号');
      }

      // 发送短信验证码
      await this.smsService.sendVerifyCode({ phone, codeLength, expires, biz });
      return '短信验证码发送成功';
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
