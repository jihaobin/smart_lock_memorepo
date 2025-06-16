import { Injectable } from '@nestjs/common';
import {
  CreateDeviceModelInput,
  UpdateDeviceModelInput,
  GetDeviceModelsInput,
  AdjustStockInput,
  DeviceModelListResponse,
  DeviceModel,
} from '@smart-lock/shared';

import { DeviceModelRepository } from './deviceModel.repository';

@Injectable()
export class DeviceModelService {
  constructor(private readonly deviceModelRepository: DeviceModelRepository) {}

  /**
   * 创建设备型号
   */
  async createDeviceModel(data: CreateDeviceModelInput): Promise<DeviceModel> {
    return await this.deviceModelRepository.createDeviceModel(data);
  }

  /**
   * 获取设备型号列表
   */
  async getDeviceModels(query: GetDeviceModelsInput) {
    return await this.deviceModelRepository.getDeviceModels(query);
  }

  /**
   * 根据ID获取设备型号
   */
  async getDeviceModelById(id: string): Promise<DeviceModel> {
    return await this.deviceModelRepository.getDeviceModelById(id);
  }

  /**
   * 更新设备型号
   */
  async updateDeviceModel(
    id: string,
    data: UpdateDeviceModelInput,
  ): Promise<DeviceModel> {
    return await this.deviceModelRepository.updateDeviceModel(id, data);
  }

  /**
   * 删除设备型号
   */
  async deleteDeviceModel(id: string): Promise<void> {
    return await this.deviceModelRepository.deleteDeviceModel(id);
  }

  /**
   * 调整库存
   */
  async adjustStock(data: AdjustStockInput): Promise<DeviceModel> {
    return await this.deviceModelRepository.adjustStock(data);
  }

  /**
   * 批量获取设备型号（供其他模块使用）
   */
  async getDeviceModelsByIds(ids: string[]): Promise<DeviceModel[]> {
    return await this.deviceModelRepository.getDeviceModelsByIds(ids);
  }
}
