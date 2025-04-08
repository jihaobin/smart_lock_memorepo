/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as nodemailer from 'nodemailer';
import * as SMTPTransport from 'nodemailer/lib/smtp-transport';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { CACHE_SERVICE, IAdvancedCacheService, ICacheService } from '../cache';
import { ValidationException } from '../exceptions';

export interface MailInfo {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// 邮件发送限制配置
const MAIL_LIMITS = {
  // 同一邮箱限制
  EMAIL_INTERVAL: 60, // 同一邮箱发送间隔（秒）
  EMAIL_DAILY_LIMIT: 10, // 同一邮箱每天最大发送次数

  // 系统总量限制
  DAILY_TOTAL_LIMIT: 1000, // 每天系统总发送量
  HOURLY_TOTAL_LIMIT: 100, // 每小时系统总发送量

  // 邮件大小限制
  MAX_TEXT_LENGTH: 5000, // 文本内容最大长度
  MAX_HTML_LENGTH: 10000, // HTML内容最大长度
} as const;

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(
    @Inject(APP_CONFIG)
    private readonly configService: AppConfig,
    @Inject(CACHE_SERVICE)
    private readonly cacheService: ICacheService | IAdvancedCacheService,
  ) {
    // 创建 SMTP 传输器
    const smtpOptions: SMTPTransport.Options = {
      host: this.configService.MAIL_HOST,
      port: Number(this.configService.MAIL_PORT),
      secure: true,
      auth: {
        user: this.configService.MAIL_USER,
        pass: this.configService.MAIL_PASS,
      },
    };
    this.transporter = nodemailer.createTransport(smtpOptions);
  }

  private getEmailKey(email: string): string {
    return `mail:limit:email:${email}`;
  }

  private getEmailDailyKey(email: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `mail:limit:email:daily:${email}:${date}`;
  }

  private getDailyTotalKey(): string {
    const date = new Date().toISOString().split('T')[0];
    return `mail:limit:total:daily:${date}`;
  }

  private getHourlyTotalKey(): string {
    const date = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    return `mail:limit:total:hourly:${date}:${hour}`;
  }

  private getRegisterVerificationCodeKey(email: string, biz: string) {
    return `verificationCode:${biz}:${email}`;
  }

  private async checkEmailLimit(email: string): Promise<void> {
    // 检查发送间隔
    const emailKey = this.getEmailKey(email);
    const lastSentTime = await this.cacheService.get<string>(emailKey);

    if (lastSentTime) {
      const remainingTime =
        MAIL_LIMITS.EMAIL_INTERVAL -
        Math.floor((Date.now() - parseInt(lastSentTime)) / 1000);
      if (remainingTime > 0) {
        throw new BadRequestException(`请等待 ${remainingTime} 秒后再试`);
      }
    }

    // 检查每日限制
    const dailyKey = this.getEmailDailyKey(email);
    const dailyCount = parseInt(
      (await this.cacheService.get<string>(dailyKey)) || '0',
    );

    if (dailyCount >= MAIL_LIMITS.EMAIL_DAILY_LIMIT) {
      throw new BadRequestException('该邮箱今日发送次数已达上限，请明天再试');
    }
  }

  private async checkSystemLimit(): Promise<void> {
    // 检查每日总量
    const dailyKey = this.getDailyTotalKey();
    const dailyTotal = parseInt(
      (await this.cacheService.get<string>(dailyKey)) || '0',
    );

    if (dailyTotal >= MAIL_LIMITS.DAILY_TOTAL_LIMIT) {
      throw new BadRequestException('系统今日邮件配额已用完，请明天再试');
    }

    // 检查每小时总量
    const hourlyKey = this.getHourlyTotalKey();
    const hourlyTotal = parseInt(
      (await this.cacheService.get<string>(hourlyKey)) || '0',
    );

    if (hourlyTotal >= MAIL_LIMITS.HOURLY_TOTAL_LIMIT) {
      throw new BadRequestException('系统当前小时邮件配额已用完，请稍后再试');
    }
  }

  private checkContentSize(mailInfo: MailInfo): void {
    if (mailInfo.text && mailInfo.text.length > MAIL_LIMITS.MAX_TEXT_LENGTH) {
      throw new BadRequestException(
        `文本内容超出长度限制 ${MAIL_LIMITS.MAX_TEXT_LENGTH} 字符`,
      );
    }

    if (mailInfo.html && mailInfo.html.length > MAIL_LIMITS.MAX_HTML_LENGTH) {
      throw new BadRequestException(
        `HTML内容超出长度限制 ${MAIL_LIMITS.MAX_HTML_LENGTH} 字符`,
      );
    }
  }

  private async updateLimits(email: string): Promise<void> {
    // 更新邮箱最后发送时间
    const emailKey = this.getEmailKey(email);
    await this.cacheService.set(
      emailKey,
      Date.now().toString(),
      MAIL_LIMITS.EMAIL_INTERVAL,
    );

    // 更新邮箱每日发送次数 - 使用缓存服务进行增加计数
    const dailyKey = this.getEmailDailyKey(email);
    await this.incrementAndExpire(dailyKey, 86400); // 24小时过期

    // 更新系统每日总量
    const dailyTotalKey = this.getDailyTotalKey();
    await this.incrementAndExpire(dailyTotalKey, 86400);

    // 更新系统每小时总量
    const hourlyKey = this.getHourlyTotalKey();
    await this.incrementAndExpire(hourlyKey, 3600);
  }

  /**
   * 增加计数并设置过期时间的辅助方法
   * 因为基础缓存接口没有incr方法，需要获取-增加-设置
   */
  private async incrementAndExpire(key: string, ttl: number): Promise<void> {
    // 尝试使用高级缓存接口（如果是IoRedis实现）
    if (this.isAdvancedCache(this.cacheService)) {
      const redis = this.cacheService.getClient<Redis>();
      await redis.incr(key);
      await redis.expire(key, ttl);
      return;
    }

    // 基础缓存接口的兼容实现
    const countStr = (await this.cacheService.get<string>(key)) || '0';
    const newCount = (parseInt(countStr) + 1).toString();
    await this.cacheService.set(key, newCount, ttl);
  }

  /**
   * 类型守卫判断是否为高级缓存实现
   */
  private isAdvancedCache(
    cache: ICacheService | IAdvancedCacheService,
  ): cache is IAdvancedCacheService {
    return 'getClient' in cache;
  }

  async sendEmail(mailInfo: MailInfo) {
    // 检查内容大小
    this.checkContentSize(mailInfo);

    // 检查发送限制
    await this.checkEmailLimit(mailInfo.to);
    await this.checkSystemLimit();

    // 发送邮件
    const info = await this.transporter.sendMail({
      from: `${this.configService.MAIL_FROM_NAME || 'Cow Course'} <${this.configService.MAIL_USER}>`,
      ...mailInfo,
    });

    // 更新限制计数
    await this.updateLimits(mailInfo.to);

    return info;
  }

  /**
   * 发送验证码
   * @param params
   * @param params.email 邮箱
   * @param params.codeLength 验证码长度
   * @param params.expires 验证码有效期(分钟)
   * @param params.biz 业务类型
   * @returns
   */
  async sendVerifyCode(params: {
    email: string;
    codeLength?: number;
    expires?: number;
    biz: string;
  }) {
    const { email, codeLength = 6, expires = 10, biz} = params;
    const code = Math.floor(
      10 ** (codeLength - 1) +
        Math.random() * (10 ** codeLength - 10 ** (codeLength - 1)),
    ).toString();
    const mailInfo = {
      to: email,
      subject: '验证码',
      text: `您的验证码是：${code}，请在${expires}分钟内完成验证。`,
    };
    await this.sendEmail(mailInfo);
    // 存储验证码在缓存中
    const verificationCodeKey = this.getRegisterVerificationCodeKey(email, biz);
    await this.cacheService.set(verificationCodeKey, code, expires * 60);

    return code;
  }

  /**
   * 验证验证码
   * @param params
   * @param params.email 邮箱
   * @param params.code 验证码
   * @param params.biz 业务类型
   * @returns
   */
  async verifyCode(params: { email: string; code: string; biz: string }) {
    const { email, code, biz } = params;
    const cacheCode = await this.cacheService.get<string>(
      this.getRegisterVerificationCodeKey(email, biz),
    );
    if (cacheCode !== code) {
      throw new ValidationException('验证码错误');
    }
    // await this.cacheService.del(this.getEmailKey(email));
    return true;
  }
}
