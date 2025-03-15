import { format } from 'winston';

import { LogFormatterOptions } from '../logger.interface';

/**
 * 创建JSON格式的日志格式化器
 * @param options 格式化器选项
 * @returns Winston格式化器
 */
export const createJsonFormatter = (options: LogFormatterOptions) => {
  const { timestamp = true } = options;

  return format.combine(
    timestamp ? format.timestamp() : format.simple(),
    format.errors({ stack: true }),
    format.json(),
  );
};
