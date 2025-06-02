import { Injectable } from '@nestjs/common';

import { DeviceRepository } from './device.repository';

/**
 * 设备管理服务
 * 处理设备和分组的业务逻辑
 */
@Injectable()
export class DeviceService {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  /**
   * 获取所有设备分组
   * @param userId 用户ID
   * @returns 设备分组列表
   */
  async getAllDeviceGroups(userId: string) {
    return await this.deviceRepository.getAllDeviceGroups(userId);
  }

  /**
   * 创建新的设备分组
   * @param groupName 分组名称
   * @param userId 用户ID
   * @returns 创建的分组信息
   */
  async createDeviceGroup(groupName: string, userId: string) {
    return this.deviceRepository.createDeviceGroup(groupName, userId);
  }

  /**
   * 删除设备分组
   * @param groupId 分组ID
   * @param userId 用户ID
   * @returns 删除的分组信息及关联的设备
   */
  async deleteDeviceGroup(groupId: string, userId: string) {
    return this.deviceRepository.deleteDeviceGroup(groupId, userId);
  }

  /**
   * 更新设备分组
   * @param groupData 分组更新数据
   * @returns 更新后的分组信息
   */
  async updateDeviceGroup(groupData: {
    userId: string;
    groupName: string;
    groupId: string;
  }) {
    return await this.deviceRepository.updateDeviceGroup(groupData);
  }

  /**
   * 绑定设备到用户
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @returns 绑定后的设备信息
   */
  async bindDeviceToUser(userId: string, deviceId: string) {
    return this.deviceRepository.bindDeviceToUser(userId, deviceId);
  }

  /**
   * 解绑设备
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @returns 解绑后的设备信息
   */
  async unbindDeviceFromUser(userId: string, deviceId: string) {
    return this.deviceRepository.unbindDeviceFromUser(userId, deviceId);
  }

  /**
   * 获取单个设备详细信息
   * @param deviceId 设备ID
   * @returns 设备详细信息
   */
  async getDeviceInfo(deviceId: string) {
    return this.deviceRepository.getDeviceInfo(deviceId);
  }

  /**
   * 获取指定分组中的设备列表
   * @param groupId 分组ID
   * @returns 该分组下的设备列表
   */
  async getDevicesByGroupId(groupId: string) {
    return this.deviceRepository.getDevicesByGroupId(groupId);
  }

  /**
   * 获取用户的所有设备
   * @param userId 用户ID
   * @returns 用户的设备列表
   */
  async getDevicesByUserId(userId: string) {
    return this.deviceRepository.getDevicesByUserId(userId);
  }

  /**
   * 获取用户的设备列表（按分组组织）
   * @param userId 用户ID
   * @returns 按分组组织的设备列表
   */
  async getDevicesWithGroups(userId: string) {
    return this.deviceRepository.getDevicesWithGroups(userId);
  }

  /**
   * 更新设备在线状态
   * @param deviceId 设备ID
   * @param isOnline 是否在线
   * @param socketId socket连接ID
   * @returns 更新后的设备信息
   */
  async updateDeviceOnlineStatus(
    deviceId: string,
    isOnline: boolean,
    socketId?: string,
  ) {
    return this.deviceRepository.updateDeviceOnlineStatus(
      deviceId,
      isOnline,
      socketId,
    );
  }
}
