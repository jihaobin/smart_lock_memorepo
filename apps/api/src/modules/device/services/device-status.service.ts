import { Inject, Injectable } from '@nestjs/common';
import { DeviceStatus } from '@smart-lock/shared';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq } from 'drizzle-orm';
import { AppLoggerService } from 'src/common';
import { DB } from 'src/database/database.provider';

import { DeviceRedisService } from './device-redis.service';

@Injectable()
export class DeviceStatusService {
  constructor(
    private readonly deviceRedisService: DeviceRedisService,
    @Inject(DB) private readonly db: DbType,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(DeviceStatusService.name);
  }

  // 从Redis获取设备状态，如果失败则从数据库获取
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      // 尝试从Redis获取
      const status = await this.deviceRedisService.getDeviceStatus(deviceId);
      if (status) return status;

      // Redis没有找到，从数据库获取
      this.logger.log(`Redis未找到设备${deviceId}状态，从数据库获取`);
      return await this.getStatusFromDb(deviceId);
    } catch (error) {
      this.logger.error(`获取设备${deviceId}状态失败: ${error.message}`);
      return null;
    }
  }

  // 更新设备状态
  async updateDeviceStatus(
    deviceId: string,
    status: Partial<DeviceStatus>,
  ): Promise<boolean> {
    try {
      // 获取当前状态
      const currentStatus = await this.getDeviceStatus(deviceId);
      if (!currentStatus) {
        this.logger.warn(`找不到设备${deviceId}，无法更新状态`);
        return false;
      }

      // 更新Redis
      const redisUpdated = await this.deviceRedisService.updateDeviceStatus(
        deviceId,
        status,
      );

      // 例如可以只在关键状态变更时同步数据库，或者使用定时任务批量同步
      if (
        redisUpdated &&
        (status.isOnline !== undefined || status.isOpen !== undefined)
      ) {
        await this.updateStatusInDb(deviceId, { ...currentStatus, ...status });
      }

      return redisUpdated;
    } catch (error) {
      this.logger.error(`更新设备${deviceId}状态失败: ${error.message}`);
      return false;
    }
  }

  // 同步Redis中的所有设备状态到数据库
  async syncAllStatusesToDb(): Promise<boolean> {
    try {
      // 获取Redis客户端
      const redis = this.deviceRedisService.getRedisClient();

      // 查找所有设备状态key
      const keys = await redis.keys('device:status:*');
      this.logger.log(`找到${keys.length}个设备状态需要同步到数据库`);

      let successCount = 0;

      // 遍历每个设备并同步状态
      for (const key of keys) {
        try {
          // 从key中提取设备ID
          const deviceId = key.split(':')[2];

          // 获取设备状态
          const status =
            await this.deviceRedisService.getDeviceStatus(deviceId);
          if (!status) continue;

          // 更新数据库
          await this.updateStatusInDb(deviceId, status);
          successCount++;
        } catch (innerError) {
          this.logger.error(`同步设备状态到数据库失败: ${innerError.message}`);
        }
      }

      this.logger.log(`成功同步${successCount}个设备状态到数据库`);
      return true;
    } catch (error) {
      this.logger.error(`同步设备状态到数据库失败: ${error.message}`);
      return false;
    }
  }

  // 私有方法：从数据库获取设备状态
  private async getStatusFromDb(
    deviceId: string,
  ): Promise<DeviceStatus | null> {
    try {
      const device = await this.db.query.devices.findFirst({
        where: eq(schema.devices.id, deviceId),
        columns: {
          status: true,
        },
      });

      if (!device || !device.status) return null;

      // 将数据库获取的状态缓存到Redis
      const status = device.status as DeviceStatus;
      await this.deviceRedisService.updateDeviceStatus(deviceId, status);

      return status;
    } catch (error) {
      this.logger.error(
        `从数据库获取设备${deviceId}状态失败: ${error.message}`,
      );
      return null;
    }
  }

  // 私有方法：更新数据库中的设备状态
  private async updateStatusInDb(
    deviceId: string,
    status: DeviceStatus,
  ): Promise<boolean> {
    try {
      await this.db
        .update(schema.devices)
        .set({ status })
        .where(eq(schema.devices.id, deviceId));
      return true;
    } catch (error) {
      this.logger.error(
        `更新数据库中设备${deviceId}状态失败: ${error.message}`,
      );
      return false;
    }
  }
}
