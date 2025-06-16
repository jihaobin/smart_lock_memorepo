import { z } from 'zod/v4';
import { IUser } from '../user';

export interface Device {
  deviceGroupId: string;
  id: string;
  name: string;
  ownerId: string;
  status: DeviceStatus;
  nikeName: string;
  deviceModel: DeviceModel;
}

export interface AdminDevice extends Device {
  owner: IUser;
}

export interface DeviceStatus {
  // 设备电量
  batteryLevel: number;
  // 设备固件版本
  firmwareVersion: number;
  // 是否在线
  isOnline: boolean;
  // 门是否开启
  isOpen: boolean;
  // 最后一次连接时间
  lastConnectionTime: string;
  // 连接ID
  connectionId: string;
}

export interface DeviceGroup {
  id: string;
  name: string;
}

export interface DeviceModel {
  id: string;
  modelName: string;
  description: string;
  hasCamera: boolean;
  hasFingerprint: boolean;
  hasFace: boolean;
  hasEye: boolean;
  hasPalm: boolean;
  hasNFC: boolean;
  hasWifi: boolean;
  hasBluetooth: boolean;
  totalStock: number;
  remainingStock: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Zod Schemas ====================
export const CreateDeviceSchema = z.object({
  name: z.string().min(1, '设备名称不能为空').max(255, '设备名称不能超过255个字符'),
  modelId: z.string().min(1, '设备型号不能为空').length(5, '设备型号ID必须为5位字符'),
  ownerId: z.string().optional(),
});

export const GetDeviceSchema = z.object({
  page: z.string().min(1, '页码必须大于0').default('1'),
  limit: z.string().min(1, '每页数量必须大于0').default('10'),
});

export const UpdateDeviceSchema = z.object({
  name: z.string().min(1, '设备名称不能为空').max(255, '设备名称不能超过255个字符'),
  modelId: z.string().min(1, '设备型号不能为空').length(5, '设备型号ID必须为5位字符'),
  ownerId: z.string().optional(),
});

export const DelectDeviceSchema = z.object({
  id: z.string().length(5, '设备型号ID必须为5位字符'),
});

// 设备型号基础 Schema
export const DeviceModelSchema = z.object({
  id: z.string().length(5, '设备型号ID必须为5位字符'),
  modelName: z.string().min(1, '型号名称不能为空').max(255, '型号名称不能超过255个字符'),
  description: z.string().optional(),
  hasCamera: z.boolean().default(false),
  hasFingerprint: z.boolean().default(false),
  hasFace: z.boolean().default(false),
  hasEye: z.boolean().default(false),
  hasPalm: z.boolean().default(false),
  hasNFC: z.boolean().default(false),
  hasWifi: z.boolean().default(false),
  hasBluetooth: z.boolean().default(false),
  totalStock: z.number().int().min(0, '总库存不能为负数').default(0),
  remainingStock: z.number().int().min(0, '剩余库存不能为负数').default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 创建设备型号 Schema
export const CreateDeviceModelSchema = z
  .object({
    modelName: z.string().min(1, '型号名称不能为空').max(255, '型号名称不能超过255个字符'),
    description: z.string().optional(),
    hasCamera: z.boolean().default(false),
    hasFingerprint: z.boolean().default(false),
    hasFace: z.boolean().default(false),
    hasEye: z.boolean().default(false),
    hasPalm: z.boolean().default(false),
    hasNFC: z.boolean().default(false),
    hasWifi: z.boolean().default(false),
    hasBluetooth: z.boolean().default(false),
    totalStock: z.number().int().min(0, '总库存不能为负数').default(0),
    remainingStock: z.number().int().min(0, '剩余库存不能为负数').default(0),
  })
  .refine(data => data.remainingStock <= data.totalStock, {
    message: '剩余库存不能大于总库存',
    path: ['remainingStock'],
  });

// 更新设备型号 Schema
export const UpdateDeviceModelSchema = z
  .object({
    id: z.string().length(5, '设备型号ID必须为5位字符'),
    modelName: z
      .string()
      .min(1, '型号名称不能为空')
      .max(255, '型号名称不能超过255个字符')
      .optional(),
    description: z.string().optional(),
    hasCamera: z.boolean().optional(),
    hasFingerprint: z.boolean().optional(),
    hasFace: z.boolean().optional(),
    hasEye: z.boolean().optional(),
    hasPalm: z.boolean().optional(),
    hasNFC: z.boolean().optional(),
    hasWifi: z.boolean().optional(),
    hasBluetooth: z.boolean().optional(),
    totalStock: z.number().int().min(0, '总库存不能为负数').optional(),
    remainingStock: z.number().int().min(0, '剩余库存不能为负数').optional(),
  })
  .refine(
    data => {
      if (data.totalStock !== undefined && data.remainingStock !== undefined) {
        return data.remainingStock <= data.totalStock;
      }
      return true;
    },
    {
      message: '剩余库存不能大于总库存',
      path: ['remainingStock'],
    }
  );

// 查询单个设备型号 Schema
export const GetDeviceModelSchema = z.object({
  id: z.string().length(5, '设备型号ID必须为5位字符'),
});

// 删除设备型号 Schema
export const DeleteDeviceModelSchema = z.object({
  id: z.string().length(5, '设备型号ID必须为5位字符'),
});

// 查询设备型号列表 Schema
export const GetDeviceModelsSchema = z.object({
  page: z.string().min(1, '页码必须大于0').default('1'),
  limit: z.string().min(1, '每页数量必须大于0').default('10'),
  search: z.string().optional(), // 搜索关键词（型号名称）
  hasCamera: z.boolean().optional(), // 筛选是否有摄像头
  hasFingerprint: z.boolean().optional(), // 筛选是否有指纹识别
  hasFace: z.boolean().optional(), // 筛选是否有人脸识别
  hasEye: z.boolean().optional(), // 筛选是否有虹膜识别
  hasPalm: z.boolean().optional(), // 筛选是否有掌纹识别
  hasNFC: z.boolean().optional(), // 筛选是否有NFC
  hasWifi: z.boolean().optional(), // 筛选是否有WiFi
  hasBluetooth: z.boolean().optional(), // 筛选是否有蓝牙
  sortBy: z
    .enum(['modelName', 'totalStock', 'remainingStock', 'createdAt', 'updatedAt'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// 库存调整 Schema
export const AdjustStockSchema = z
  .object({
    id: z.string().length(5, '设备型号ID必须为5位字符'),
    adjustment: z.number().int().describe('库存调整数量，正数为增加，负数为减少'),
  })
  .refine(data => data.adjustment !== 0, {
    message: '调整数量不能为0',
    path: ['adjustment'],
  });

// ==================== TypeScript Types ====================

export type CreateDeviceInput = z.infer<typeof CreateDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof UpdateDeviceSchema>;
export type DelectDeviceInput = z.infer<typeof DelectDeviceSchema>;
export type GetDeviceInput = z.infer<typeof GetDeviceSchema>;

export type CreateDeviceModelInput = z.input<typeof CreateDeviceModelSchema>;
export type UpdateDeviceModelInput = z.infer<typeof UpdateDeviceModelSchema>;
export type GetDeviceModelInput = z.infer<typeof GetDeviceModelSchema>;
export type DeleteDeviceModelInput = z.infer<typeof DeleteDeviceModelSchema>;
export type GetDeviceModelsInput = z.infer<typeof GetDeviceModelsSchema>;
export type AdjustStockInput = z.infer<typeof AdjustStockSchema>;

// 设备型号列表响应类型
export interface DeviceModelListResponse {
  data: DeviceModel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 库存调整记录类型
export interface StockAdjustmentRecord {
  id: string;
  deviceModelId: string;
  adjustment: number;
  reason: string;
  operatorId: string;
  createdAt: Date;
}
