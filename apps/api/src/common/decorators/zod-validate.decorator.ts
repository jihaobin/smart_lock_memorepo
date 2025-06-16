import {
  createParamDecorator,
  ExecutionContext,
  UsePipes,
} from '@nestjs/common';
import { Request } from 'express';
import { ZodSchema, ZodError } from 'zod/v4';

import { ZodValidationPipe } from '../pipes/zod-validation.pipe';
import { ValidationTargetType, createValidationException } from '../validation';

/**
 * 创建Zod验证装饰器
 *
 * @param schema Zod验证模式
 * @param targetType 验证目标类型
 * @param errorMessage 自定义错误消息
 * @returns 参数装饰器
 */
export function ZodValidate(
  schema: ZodSchema,
  targetType: ValidationTargetType = ValidationTargetType.BODY,
  errorMessage: string = '请求参数验证失败',
) {
  return createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    let value: unknown;

    // 根据目标类型获取相应的值
    switch (targetType) {
      case ValidationTargetType.BODY:
        value = request.body;
        break;
      case ValidationTargetType.QUERY:
        value = request.query;
        break;
      case ValidationTargetType.PARAM:
        value = request.params;
        break;
      case ValidationTargetType.HEADER:
        value = request.headers;
        break;
      case ValidationTargetType.CUSTOM:
        value = data; // 自定义数据
        break;
      default:
        value = request.body;
    }

    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createValidationException(error, errorMessage);
      }
      throw error;
    }
  });
}

/**
 * Body参数Zod验证装饰器
 *
 * @param schema Zod验证模式
 * @param errorMessage 自定义错误消息
 * @returns 参数装饰器
 */
export const ZodBody = (schema: ZodSchema, errorMessage?: string) =>
  UsePipes(new ZodValidationPipe(schema, errorMessage));

/**
 * Query参数Zod验证装饰器
 *
 * @param schema Zod验证模式
 * @param errorMessage 自定义错误消息
 * @returns 参数装饰器
 */
export const ZodQuery = (
  schema: ZodSchema,
  errorMessage: string = '查询参数验证失败',
) => ZodValidate(schema, ValidationTargetType.QUERY, errorMessage);

/**
 * Param参数Zod验证装饰器
 *
 * @param schema Zod验证模式
 * @param errorMessage 自定义错误消息
 * @returns 参数装饰器
 */
export const ZodParam = (
  schema: ZodSchema,
  errorMessage: string = '路径参数验证失败',
) => ZodValidate(schema, ValidationTargetType.PARAM, errorMessage);

/**
 * Header参数Zod验证装饰器
 *
 * @param schema Zod验证模式
 * @param errorMessage 自定义错误消息
 * @returns 参数装饰器
 */
export const ZodHeader = (
  schema: ZodSchema,
  errorMessage: string = '请求头验证失败',
) => ZodValidate(schema, ValidationTargetType.HEADER, errorMessage);
