import { Injectable } from '@nestjs/common';
import {
  CreateDeviceInput,
  UpdateDeviceInput,
  GetDeviceInput,
  DelectDeviceInput,
} from '@smart-lock/shared';

import { DeviceRepository } from './device.repository';

@Injectable()
export class DeviceService {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  /**
   * 创建设备
   * @param createDeviceDto 创建设备的数据（包含可选的ownerId）
   * @returns 创建的设备信息
   */
  async create(createDeviceDto: CreateDeviceInput) {
    return await this.deviceRepository.createDevice(createDeviceDto);
  }

  /**
   * 获取设备列表（分页）
   * @param query 查询参数（包含可选的ownerId）
   * @returns 设备列表和分页信息
   */
  async findAll(query: GetDeviceInput) {
    return await this.deviceRepository.getAllDevices(query);
  }

  /**
   * 根据ID获取设备详情
   * @param deviceId 设备ID
   * @returns 设备详情
   */
  async findOne(deviceId: string) {
    return await this.deviceRepository.getDeviceById(deviceId);
  }

  /**
   * 更新设备信息
   * @param deviceId 设备ID
   * @param updateDeviceDto 更新数据
   * @returns 更新后的设备信息
   */
  async update(deviceId: string, updateDeviceDto: UpdateDeviceInput) {
    return await this.deviceRepository.updateDevice(deviceId, updateDeviceDto);
  }

  /**
   * 删除设备
   * @param deviceId 设备ID
   * @returns 删除的设备信息
   */
  async remove(deviceId: string) {
    return await this.deviceRepository.deleteDevice(deviceId);
  }
}
