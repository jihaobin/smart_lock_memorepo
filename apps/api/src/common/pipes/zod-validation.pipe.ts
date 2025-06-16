import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod/v4';

import { createValidationException } from '../validation';

/**
 * 通用Zod验证管道
 * 用于验证请求参数（body, query, params等）
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  /**
   * @param schema - Zod验证模式
   * @param errorMessage - 自定义错误消息
   */
  constructor(
    private readonly schema: ZodSchema,
    private readonly errorMessage: string = '请求参数验证失败',
  ) {}

  /**
   * 管道转换方法
   *
   * @param value - 输入值
   * @param metadata - 元数据
   * @returns 验证并可能转换后的值
   */
  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      // 对空对象的特殊处理
      if (
        metadata.type === 'body' &&
        typeof value === 'object' &&
        Object.keys(value as object).length === 0
      ) {
        value = {}; // 确保空对象也被正确处理
      }
      console.log('校验之前的值', value);

      // 使用schema验证并转换值
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        // 抛出ValidationException，与系统的错误处理集成
        throw createValidationException(error, this.errorMessage);
      }

      // 非Zod错误直接抛出
      throw error;
    }
  }
}
