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
  LoginSchemaType,
  RegisterSchemaType,
} from '@smart-lock/shared';
import * as argon2 from 'argon2';
import { MailService } from 'src/common/mail/mail.service';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { ValidationException } from '../../../common/exceptions';
import { AuthRepository } from '../repositories/auth.repository';
import { JwtPayload, AuthResponse } from '../schemas/auth.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  /**
   * 注册新用户
   * @param registerDto 注册信息
   * @returns 注册成功的用户信息和令牌
   */
  async register(registerDto: RegisterSchemaType): Promise<AuthResponse> {
    // 检查两次密码是否一致
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new ValidationException(
        '两次输入的密码不一致',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // 检查邮箱是否已被注册
    const existingUser = await this.authRepository.findUserByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 检查验证码
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const verificationCode = await this.mailService.verifyCode({
      email: registerDto.email,
      code: registerDto.verificationCode,
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
      sub: user.id,
      email: user.email,
    };
    const token = this.jwtService.sign(payload, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      expiresIn: this.config.JWT_EXPIRES_IN,
    });

    // 返回登录成功的响应
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        nikeName: user.nikeName,
      },
    };
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @returns 登录成功的用户信息和令牌
   */
  async login(loginDto: LoginSchemaType): Promise<AuthResponse> {
    // 查找用户
    const user = await this.authRepository.findUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 生成JWT令牌
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    const token = this.jwtService.sign(payload, {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      expiresIn: this.config.JWT_EXPIRES_IN,
    });

    // 返回登录成功的响应
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        nikeName: user.nikeName,
      },
    };
  }

  /**
   * 验证用户
   * @param payload JWT负载
   * @returns 验证成功的用户信息
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.authRepository.findUserByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('未授权');
    }
    return user;
  }

  /**
   * 发送验证码
   * @param email 邮箱
   * @param codeLength 验证码长度
   * @param expires 验证码有效期(分钟)
   * @returns 验证码
   */
  async sendVerifyCode(email: string, codeLength?: number, expires?: number) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      await this.mailService.sendVerifyCode({ email, codeLength, expires });
      return '发送成功';
    } catch {
      throw new BadRequestException('发送验证码失败');
    }
  }
}
