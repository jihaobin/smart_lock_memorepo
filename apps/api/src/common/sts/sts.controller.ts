import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';

import { STSService } from './sts.service';

@Controller('sts')
export class STSController {
  constructor(private readonly stsService: STSService) {}

  /**
   * 获取STS临时访问凭证
   * @returns STS临时访问凭证
   */
  @UseGuards(JwtAuthGuard)
  @Get('token')
  async getToken() {
    const credentials = await this.stsService.getSTSCredentials();
    return {
      accessKeyId: credentials.accessKeyId,
      securityToken: credentials.securityToken,
      expiration: credentials.expiration,
      // 不返回accessKeySecret以提高安全性
    };
  }

  /**
   * 验证STS Token是否有效
   * @param body 包含Token的请求体
   * @returns 验证结果
   */
  @Post('validate')
  async validateToken(@Body() body: { token: string }) {
    const isValid = await this.stsService.validateToken(body.token);
    return { valid: isValid };
  }
}