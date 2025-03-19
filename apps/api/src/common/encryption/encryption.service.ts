import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
@Injectable()
export class EncryptionService {
  // Argon2配置
  private readonly argon2Options = {
    type: argon2.argon2id, // 使用argon2id变体
    memoryCost: 2 ** 16, // 64MB内存
    timeCost: 3, // 迭代次数
    parallelism: 2, // 并行度
    saltLength: 16, // 盐值长度
    hashLength: 32, // 输出哈希长度
  };

  /**
   * 对密码进行哈希处理
   * @param password 原始密码
   * @returns 哈希后的密码
   */
  async bcrypt(password: string): Promise<string> {
    try {
      return await argon2.hash(password, this.argon2Options);
    } catch {
      throw new Error('密码加密失败');
    }
  }

  /**
   * 验证密码
   * @param plainPassword 待验证的明文密码
   * @param hashedPassword 已存储的哈希密码
   * @returns 是否匹配
   */
  async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(hashedPassword, plainPassword);
    } catch {
      throw new Error('验证失败');
    }
  }
}
