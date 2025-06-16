import { DeviceUnlockRecordOpenType } from '@smart-lock/shared';
import { z } from 'zod/v4';

// 使用正确的导入路径

// 创建解锁记录的验证Schema
export const createUnlockRecordSchema = z.object({
  deviceId: z.string().length(5, { message: '设备ID必须为5个字符' }),
  userId: z.string().length(5, { message: '用户ID必须为5个字符' }).optional(),
  unlockType: z.enum([
    'remote',
    'key',
    'nfc',
    'temporary_password',
    'permanent_password',
    'face',
    'eye',
    'fingerprint',
  ] as [DeviceUnlockRecordOpenType, ...DeviceUnlockRecordOpenType[]]),
  unlockData: z
    .object({
      password: z.string().optional(),
      // temporaryPasswordInfo: temporaryPasswordInfoSchema.optional(),
      faceFeatures: z.string().optional(),
      faceMatchScore: z.number().min(0).max(100).optional(),
      eyeFeatures: z.string().optional(),
      eyeMatchScore: z.number().min(0).max(100).optional(),
      fingerprintFeatures: z.string().optional(),
      fingerprintMatchScore: z.number().min(0).max(100).optional(),
      isRemoteSuccess: z.boolean().optional(),
      nfcId: z.string().optional(),
      remoteImage: z.string().optional(),
    })
    .optional(),
});

// 查询解锁记录的验证Schema
export const queryUnlockRecordSchema = z.object({
  deviceId: z.string().length(5, { message: '设备ID必须为5个字符' }).optional(),
  userId: z.string().length(5, { message: '用户ID必须为5个字符' }).optional(),
  unlockType: z
    .enum([
      'remote',
      'key',
      'nfc',
      'temporary_password',
      'permanent_password',
      'face',
      'eye',
      'fingerprint',
    ] as [DeviceUnlockRecordOpenType, ...DeviceUnlockRecordOpenType[]])
    .optional(),
  startTime: z
    .string()
    .datetime({ message: '开始时间必须为有效的ISO日期时间格式' })
    .optional(),
  endTime: z
    .string()
    .datetime({ message: '结束时间必须为有效的ISO日期时间格式' })
    .optional(),
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('10'),
});

// 获取单个解锁记录的验证Schema
export const getUnlockRecordSchema = z.object({
  id: z.string().length(5, { message: '记录ID必须为5个字符' }),
});

// 更新解锁记录的验证Schema
export const updateUnlockRecordSchema = z.object({
  id: z.string().length(5, { message: '记录ID必须为5个字符' }),
  unlockData: z
    .object({
      password: z.string().optional(),
      temporaryPasswordId: z.string().optional(),
      faceFeatures: z.string().optional(),
      faceMatchScore: z.number().min(0).max(100).optional(),
      eyeFeatures: z.string().optional(),
      eyeMatchScore: z.number().min(0).max(100).optional(),
      fingerprintFeatures: z.string().optional(),
      fingerprintMatchScore: z.number().min(0).max(100).optional(),
      isRemoteSuccess: z.boolean().optional(),
      operatorId: z.string().optional(),
      nfcId: z.string().optional(),
    })
    .optional(),
});

// 删除解锁记录的验证Schema
export const deleteUnlockRecordSchema = z.object({
  id: z.string().length(5, { message: '记录ID必须为5个字符' }),
});

// 导出类型
export type CreateUnlockRecordDto = z.infer<typeof createUnlockRecordSchema>;
export type QueryUnlockRecordDto = z.infer<typeof queryUnlockRecordSchema>;
export type GetUnlockRecordDto = z.infer<typeof getUnlockRecordSchema>;
export type UpdateUnlockRecordDto = z.infer<typeof updateUnlockRecordSchema>;
export type DeleteUnlockRecordDto = z.infer<typeof deleteUnlockRecordSchema>;
