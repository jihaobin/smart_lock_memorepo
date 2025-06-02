import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DbType } from '@smart-lock/shared';
import { schema } from '@smart-lock/shared/server';
import { and, eq } from 'drizzle-orm';
import { DB } from 'src/database/database.provider';

/**
 * 设备管理仓库层
 * 负责设备数据和分组的数据库操作
 */
@Injectable()
export class DeviceRepository {
  @Inject(DB) db: DbType;

  // 设备分组相关方法
  /**
   * 创建新的设备分组
   * @param device 设备信息
   * @returns 创建的设备信息
   */
  async createDeviceGroup(groupName: string, userId: string) {
    const groupInfo = await this.db
      .insert(schema.deviceGroups)
      .values({
        name: groupName,
        userId: userId,
      })
      .returning();

    return groupInfo;
  }

  /**
   * 获取全部设备分组
   * @param userId 用户ID
   * @returns 设备分组列表
   */
  async getAllDeviceGroups(userId: string) {
    const groups = await this.db.query.deviceGroups.findMany({
      where: eq(schema.deviceGroups.userId, userId),
      columns: {
        id: true,
        name: true,
      },
    });

    return groups;
  }

  /**
   * 删除设备分组
   * 同时删除该分组下的所有设备
   * @param groupId 分组ID
   * @returns 删除的分组和设备信息
   */
  async deleteDeviceGroup(groupId: string, userId: string) {
    const group = await this.db.query.deviceGroups.findFirst({
      where: eq(schema.deviceGroups.id, groupId),
    });

    if (!group) {
      throw new BadRequestException('分组不存在');
    }

    if (group.userId !== userId) {
      throw new BadRequestException('分组不属于当前用户');
    }

    return await this.db.transaction(async (tx) => {
      // 1. 更新该分组下的所有设备，将它们的 deviceGroupId 设置为 null
      const updatedDevices = await tx
        .update(schema.devices)
        .set({ deviceGroupId: null })
        .where(eq(schema.devices.deviceGroupId, groupId))
        .returning();

      // 2. 删除分组本身
      const deletedGroup = await tx
        .delete(schema.deviceGroups)
        .where(eq(schema.deviceGroups.id, groupId))
        .returning();

      return {
        group: deletedGroup,
        devices: updatedDevices,
      };
    });
  }

  /**
   * 更新设备分组信息
   * @param userId 用户ID
   * @param groupName 新的设备名称
   * @returns 更新后的分组信息
   */
  async updateDeviceGroup(groupData: {
    userId: string;
    groupName: string;
    groupId: string;
  }) {
    const group = await this.db.query.deviceGroups.findFirst({
      where: and(
        eq(schema.deviceGroups.userId, groupData.userId),
        eq(schema.deviceGroups.id, groupData.groupId),
      ),
    });

    if (!group) {
      throw new BadRequestException('分组不存在');
    }

    if (group.userId !== groupData.userId) {
      throw new BadRequestException('分组不属于当前用户');
    }

    return await this.db
      .update(schema.deviceGroups)
      .set({ name: groupData.groupName })
      .where(
        and(
          eq(schema.deviceGroups.userId, groupData.userId),
          eq(schema.deviceGroups.id, groupData.groupId),
        ),
      )
      .returning();
  }

  /**
   * 将设备和用户进行绑定
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @returns 绑定的用户和设备信息
   */
  async bindDeviceToUser(userId: string, deviceId: string) {
    const device = await this.db.query.devices.findFirst({
      where: eq(schema.devices.id, deviceId),
    });

    if (!device) {
      throw new Error('设备不存在');
    }
    return this.db
      .update(schema.devices)
      .set({ ownerId: userId })
      .where(eq(schema.devices.id, deviceId))
      .returning();
  }

  /**
   * 解绑设备和用户
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @returns 解绑的用户和设备信息
   */
  async unbindDeviceFromUser(userId: string, deviceId: string) {
    const device = await this.db.query.devices.findFirst({
      where: and(
        eq(schema.devices.ownerId, userId),
        eq(schema.devices.id, deviceId),
      ),
    });

    if (!device) {
      throw new Error('设备不存在');
    }

    if (device.ownerId !== userId) {
      throw new Error('设备不属于当前用户');
    }

    return this.db
      .update(schema.devices)
      .set({ ownerId: null })
      .where(eq(schema.devices.id, deviceId))
      .returning();
  }

  /**
   * 获取指定分组中的设备列表
   * @param groupId 分组ID
   * @returns 该分组下的设备列表
   */
  async getDevicesByGroupId(groupId: string) {
    return await this.db.query.devices.findMany({
      where: eq(schema.devices.deviceGroupId, groupId),
      orderBy: schema.devices.name,
    });
  }

  /**
   * 获取单个设备详细信息
   * @param friendId 好友关系ID
   * @returns 设备信息，包括所属分组
   */
  async getDeviceInfo(deviceId: string) {
    return await this.db.query.devices.findFirst({
      where: eq(schema.devices.id, deviceId),
      with: {
        deviceGroup: true,
      },
    });
  }

  /**
   * 获取用户的所有设备
   * @param userId 用户ID
   * @param includeGroups 是否包含分组信息
   * @returns 用户的设备列表
   */
  async getDevicesByUserId(userId: string) {
    // 如果不需要分组信息，只返回设备列表
    return await this.db.query.devices.findMany({
      where: eq(schema.devices.ownerId, userId),
      orderBy: schema.devices.name,
    });
  }

  /**
   * 获取用户的设备列表（按分组组织）
   * @param userId 用户ID
   * @returns 按分组组织的设备列表
   */
  async getDevicesWithGroups(userId: string) {
    // 按分组返回设备列表
    return await this.db.query.deviceGroups.findMany({
      where: eq(schema.deviceGroups.userId, userId),
      with: {
        devices: true,
      },
    });
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
    const device = await this.db.query.devices.findFirst({
      where: eq(schema.devices.id, deviceId),
    });

    if (!device) {
      throw new Error(`设备${deviceId}不存在`);
    }

    // 获取现有状态
    const currentStatus = device.status;
    const newStatus = {
      ...currentStatus,
      isOnline,
      lastConnectionTime: new Date().toISOString(),
    };

    if (socketId) {
      newStatus.connectionId = socketId;
    }

    return await this.db
      .update(schema.devices)
      .set({
        status: newStatus,
      })
      .where(eq(schema.devices.id, deviceId))
      .returning();
  }
}
