import { z } from 'zod';

import { TemporaryPasswordInfo, temporaryPasswordInfoSchema } from '../temporaryPassword';

export interface DeviceUnlockRecordData {
  // 密码开锁/临时密码开锁
  password?: string;
  // 临时密码开锁的相关信息
  temporaryInfo?: TemporaryPasswordInfo;
  // 人脸开锁
  faceFeatures?: string;
  faceMatchScore?: number;
  // 瞳孔开锁
  eyeFeatures?: string;
  eyeMatchScore?: number;
  // 指纹开锁
  fingerprintFeatures?: string;
  fingerprintMatchScore?: number;
  // 远程开锁是否成功
  isRemoteSuccess?: boolean;
  // 远程开锁时摄像头拍摄的图片
  remoteImage?: string;
  // NFC开锁
  nfcId?: string;
  // 好友开锁
  friendName?: string;
}

export const deviceUnlockRecordDataSchema = z.object({
  password: z.string().optional(),
  temporaryInfo: temporaryPasswordInfoSchema.optional(),
  faceFeatures: z.string().optional(),
  faceMatchScore: z.number().optional(),
  eyeFeatures: z.string().optional(),
  eyeMatchScore: z.number().optional(),
  fingerprintFeatures: z.string().optional(),
  fingerprintMatchScore: z.number().optional(),
  isRemoteSuccess: z.boolean().optional(),
  nfcId: z.string().optional(),
  remoteImage: z.string().optional(),
  friendName: z.string().optional(),
});

export type DeviceUnlockRecordOpenType =
  | 'remote'
  | 'temporary_password'
  | 'key'
  | 'nfc'
  | 'permanent_password'
  | 'face'
  | 'eye'
  | 'fingerprint';
