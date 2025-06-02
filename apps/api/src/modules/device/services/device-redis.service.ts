import { Inject, Injectable } from '@nestjs/common';
import { DeviceStatus } from '@smart-lock/shared';
import { Redis } from 'ioredis';
import { AppLoggerService } from 'src/common';
import { CACHE_SERVICE, IAdvancedCacheService } from 'src/common/cache';

// 设备连接信息
export interface DeviceConnectionInfo {
  deviceId: string;
  socketId: string;
  isOnline: boolean;
  lastConnect?: string;
  lastDisconnect?: string;
  lastHeartbeat?: string;
  lastActivity?: string;
  ip?: string;
  status?: Partial<DeviceStatus>;
  [key: string]: unknown;
}

// 用户连接信息
export interface UserConnectionInfo {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastConnect?: string;
  lastDisconnect?: string;
  lastActivity?: string;
  ip?: string;
  clientInfo?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class DeviceRedisService {
  // Redis键名
  private readonly DEVICE_HASH = 'device:info'; // Hash: {deviceId -> JSON字符串}
  private readonly DEVICE_ONLINE_SET = 'device:online'; // Sorted Set: {deviceId -> timestamp}
  private readonly PENDING_UNLOCK_HASH = 'device:unlock:pending'; // Hash: {deviceId -> userId}
  private readonly PENDING_UNLOCK_TIME_HASH = 'device:unlock:time'; // Hash: {deviceId -> timestamp}
  private readonly USER_HASH = 'user:connection:info'; // Hash: {userId -> JSON字符串}
  private readonly USER_ONLINE_SET = 'user:online'; // Sorted Set: {userId -> timestamp}
  private readonly DEVICE_STATUS_KEY = (deviceId: string) =>
    `device:status:${deviceId}`;
  private readonly DEVICE_IMAGE_KEY = (deviceId: string) =>
    `device:image:${deviceId}`; // 设备图片键
  private readonly DEVICE_REQUEST_ID_KEY = (deviceId: string) =>
    `device:unlock:request:${deviceId}`;

  constructor(
    @Inject(CACHE_SERVICE) private readonly cacheService: IAdvancedCacheService,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(DeviceRedisService.name);
  }

  // Redis客户端获取方法
  getRedisClient(): Redis {
    return this.cacheService.getClient<Redis>();
  }

  // 设备状态管理
  // -----------------------------

  // 从Redis获取设备状态
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const key = this.DEVICE_STATUS_KEY(deviceId);
      const status = await this.cacheService.get<DeviceStatus>(key);
      return status || null;
    } catch (error) {
      this.logger.warn(`从Redis获取设备${deviceId}状态失败: ${error.message}`);
      return null;
    }
  }

  // 更新Redis中的设备状态
  async updateDeviceStatus(
    deviceId: string,
    status: Partial<DeviceStatus>,
  ): Promise<boolean> {
    try {
      // 获取当前状态
      const currentStatus = await this.getDeviceStatus(deviceId);
      // 合并新旧状态
      const newStatus = currentStatus
        ? { ...currentStatus, ...status }
        : (status as DeviceStatus);

      const key = this.DEVICE_STATUS_KEY(deviceId);
      // 缓存过期时间设为1天
      await this.cacheService.set(key, newStatus, 86400);
      return true;
    } catch (error) {
      this.logger.error(`更新Redis中设备${deviceId}状态失败: ${error.message}`);
      return false;
    }
  }

  // 设备连接信息管理
  // -----------------------------

  // 保存设备连接信息
  async saveDeviceConnectionInfo(
    deviceInfo: DeviceConnectionInfo,
  ): Promise<boolean> {
    try {
      const { deviceId } = deviceInfo;
      await this.cacheService.hSet(
        this.DEVICE_HASH,
        deviceId,
        JSON.stringify(deviceInfo),
      );
      return true;
    } catch (error) {
      this.logger.error(`保存设备连接信息失败: ${error.message}`);
      return false;
    }
  }

  // 获取设备连接信息
  async getDeviceConnectionInfo(
    deviceId: string,
  ): Promise<DeviceConnectionInfo | null> {
    try {
      const deviceInfoStr = await this.cacheService.hGet<string>(
        this.DEVICE_HASH,
        deviceId,
      );
      if (!deviceInfoStr) return null;
      return JSON.parse(deviceInfoStr) as DeviceConnectionInfo;
    } catch (error) {
      this.logger.error(`获取设备${deviceId}连接信息失败: ${error.message}`);
      return null;
    }
  }

  // 在线设备管理
  // -----------------------------

  // 设置设备在线
  async setDeviceOnline(deviceId: string): Promise<boolean> {
    try {
      await this.getRedisClient().zadd(
        this.DEVICE_ONLINE_SET,
        Date.now(),
        deviceId,
      );
      return true;
    } catch (error) {
      this.logger.error(`设置设备${deviceId}在线状态失败: ${error.message}`);
      return false;
    }
  }

  // 设置设备离线
  async setDeviceOffline(deviceId: string): Promise<boolean> {
    try {
      await this.getRedisClient().zrem(this.DEVICE_ONLINE_SET, deviceId);
      return true;
    } catch (error) {
      this.logger.error(`设置设备${deviceId}离线状态失败: ${error.message}`);
      return false;
    }
  }

  // 检查设备是否在线
  async isDeviceOnline(deviceId: string): Promise<boolean> {
    try {
      const score = await this.getRedisClient().zscore(
        this.DEVICE_ONLINE_SET,
        deviceId,
      );
      return score !== null;
    } catch (error) {
      this.logger.error(`检查设备${deviceId}在线状态失败: ${error.message}`);
      return false;
    }
  }

  // 获取所有在线设备
  async getAllOnlineDevices(
    limit?: number,
    withLastActivity = false,
  ): Promise<string[] | Array<{ deviceId: string; lastActivity: number }>> {
    try {
      if (withLastActivity) {
        // 返回设备ID和最后活动时间
        const results = await this.getRedisClient().zrange(
          this.DEVICE_ONLINE_SET,
          0,
          limit ? limit - 1 : -1,
          'WITHSCORES',
        );
        // 将结果转换为设备ID和时间戳的对象数组
        const devices: Array<{ deviceId: string; lastActivity: number }> = [];
        for (let i = 0; i < results.length; i += 2) {
          devices.push({
            deviceId: results[i],
            lastActivity: parseInt(results[i + 1]),
          });
        }
        return devices;
      } else {
        // 只返回设备ID列表
        return await this.getRedisClient().zrange(
          this.DEVICE_ONLINE_SET,
          0,
          limit ? limit - 1 : -1,
        );
      }
    } catch (error) {
      this.logger.error(`获取在线设备列表失败: ${error.message}`);
      return [];
    }
  }

  // 开锁请求管理
  // -----------------------------

  // 创建带有requestId的开锁请求
  async createPendingUnlockRequest(
    deviceId: string,
    userId: string,
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString();
      const requestId = `unlock_${deviceId}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

      await this.getRedisClient()
        .pipeline()
        .hset(this.PENDING_UNLOCK_HASH, deviceId, userId)
        .hset(this.PENDING_UNLOCK_TIME_HASH, deviceId, timestamp)
        .set(this.DEVICE_REQUEST_ID_KEY(deviceId), requestId, 'EX', 300)
        .expire(this.PENDING_UNLOCK_HASH, 300)
        .expire(this.PENDING_UNLOCK_TIME_HASH, 300)
        .exec();

      return requestId;
    } catch (error) {
      this.logger.error(`创建挂起的开锁请求失败: ${error.message}`);
      return '';
    }
  }

  // 获取挂起的开锁请求
  async getPendingUnlockRequest(
    deviceId: string,
  ): Promise<{ userId: string; timestamp: string } | null> {
    try {
      const results = await this.getRedisClient()
        .pipeline()
        .hget(this.PENDING_UNLOCK_HASH, deviceId)
        .hget(this.PENDING_UNLOCK_TIME_HASH, deviceId)
        .exec();

      if (!results || results.length !== 2) return null;
      const [userIdErr, userId] = results[0];
      const [, timestamp] = results[1];

      if (userIdErr || !userId) return null;

      return {
        userId: userId.toString(),
        timestamp: timestamp ? timestamp.toString() : new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`获取挂起的开锁请求失败: ${error.message}`);
      return null;
    }
  }

  // 删除挂起的开锁请求
  async deletePendingUnlockRequest(deviceId: string): Promise<boolean> {
    try {
      await this.getRedisClient()
        .pipeline()
        .hdel(this.PENDING_UNLOCK_HASH, deviceId)
        .hdel(this.PENDING_UNLOCK_TIME_HASH, deviceId)
        .exec();
      return true;
    } catch (error) {
      this.logger.error(`删除挂起的开锁请求失败: ${error.message}`);
      return false;
    }
  }

  // 获取设备当前请求ID
  async getDeviceRequestId(deviceId: string): Promise<string | null> {
    try {
      const result = await this.getRedisClient().get(
        this.DEVICE_REQUEST_ID_KEY(deviceId),
      );
      return result;
    } catch (error) {
      this.logger.error(`获取设备请求ID失败: ${error.message}`);
      return null;
    }
  }

  // 用户连接管理
  // -----------------------------

  // 保存用户连接信息
  async saveUserConnectionInfo(userInfo: UserConnectionInfo): Promise<boolean> {
    try {
      const { userId } = userInfo;
      await this.cacheService.hSet(
        this.USER_HASH,
        userId,
        JSON.stringify(userInfo),
      );
      return true;
    } catch (error) {
      this.logger.error(`保存用户连接信息失败: ${error.message}`);
      return false;
    }
  }

  // 获取用户连接信息
  async getUserConnectionInfo(
    userId: string,
  ): Promise<UserConnectionInfo | null> {
    try {
      const userInfoStr = await this.cacheService.hGet<string>(
        this.USER_HASH,
        userId,
      );
      if (!userInfoStr) return null;
      return JSON.parse(userInfoStr) as UserConnectionInfo;
    } catch (error) {
      this.logger.error(`获取用户${userId}连接信息失败: ${error.message}`);
      return null;
    }
  }

  // 设置用户在线
  async setUserOnline(userId: string): Promise<boolean> {
    try {
      await this.getRedisClient().zadd(
        this.USER_ONLINE_SET,
        Date.now(),
        userId,
      );
      return true;
    } catch (error) {
      this.logger.error(`设置用户${userId}在线状态失败: ${error.message}`);
      return false;
    }
  }

  // 设置用户离线
  async setUserOffline(userId: string): Promise<boolean> {
    try {
      await this.getRedisClient().zrem(this.USER_ONLINE_SET, userId);
      return true;
    } catch (error) {
      this.logger.error(`设置用户${userId}离线状态失败: ${error.message}`);
      return false;
    }
  }

  // 检查用户是否在线
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const score = await this.getRedisClient().zscore(
        this.USER_ONLINE_SET,
        userId,
      );
      return score !== null;
    } catch (error) {
      this.logger.error(`检查用户${userId}在线状态失败: ${error.message}`);
      return false;
    }
  }

  // 获取所有在线用户
  async getAllOnlineUsers(
    limit?: number,
    withLastActivity = false,
  ): Promise<string[] | Array<{ userId: string; lastActivity: number }>> {
    try {
      if (withLastActivity) {
        // 返回用户ID和最后活动时间
        const results = await this.getRedisClient().zrange(
          this.USER_ONLINE_SET,
          0,
          limit ? limit - 1 : -1,
          'WITHSCORES',
        );
        // 将结果转换为用户ID和时间戳的对象数组
        const users: Array<{ userId: string; lastActivity: number }> = [];
        for (let i = 0; i < results.length; i += 2) {
          users.push({
            userId: results[i],
            lastActivity: parseInt(results[i + 1]),
          });
        }
        return users;
      } else {
        // 只返回用户ID列表
        return await this.getRedisClient().zrange(
          this.USER_ONLINE_SET,
          0,
          limit ? limit - 1 : -1,
        );
      }
    } catch (error) {
      this.logger.error(`获取在线用户列表失败: ${error.message}`);
      return [];
    }
  }

  // 更新用户活动时间
  async updateUserActivity(userId: string): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();

      // 更新在线集合的时间戳
      await this.setUserOnline(userId);

      // 更新用户信息中的活动时间
      const userInfo = await this.getUserConnectionInfo(userId);
      if (userInfo) {
        userInfo.lastActivity = timestamp;
        await this.saveUserConnectionInfo(userInfo);
      }

      return true;
    } catch (error) {
      this.logger.error(`更新用户${userId}活动时间失败: ${error.message}`);
      return false;
    }
  }

  // 设备图片管理
  // -----------------------------

  // 修改图片存储方法，支持请求ID
  async saveDeviceImage(
    deviceId: string,
    requestId: string,
    base64Image: string,
    expireSeconds: number = 300,
  ): Promise<boolean> {
    try {
      const key = requestId
        ? `${this.DEVICE_IMAGE_KEY(deviceId)}:${requestId}`
        : this.DEVICE_IMAGE_KEY(deviceId);
      await this.cacheService.set(key, base64Image, expireSeconds);
      return true;
    } catch (error) {
      this.logger.error(`保存设备图片失败: ${error.message}`);
      return false;
    }
  }

  // 修改图片获取方法，支持请求ID
  async getDeviceImage(
    deviceId: string,
    requestId?: string,
  ): Promise<string | null> {
    try {
      const key = requestId
        ? `${this.DEVICE_IMAGE_KEY(deviceId)}:${requestId}`
        : this.DEVICE_IMAGE_KEY(deviceId);
      const result = await this.cacheService.get<string>(key);
      if (result) {
        return `data:image/avif;base64,${result}`;
      }
      return null;
    } catch (error) {
      this.logger.error(`获取设备图片失败: ${error.message}`);
      return null;
    }
  }

  // 删除图片，支持请求ID
  async deleteDeviceImage(
    deviceId: string,
    requestId?: string,
  ): Promise<boolean> {
    try {
      const key = requestId
        ? `${this.DEVICE_IMAGE_KEY(deviceId)}:${requestId}`
        : this.DEVICE_IMAGE_KEY(deviceId);
      await this.cacheService.del(key);
      return true;
    } catch (error) {
      this.logger.error(`删除设备图片失败: ${error.message}`);
      return false;
    }
  }

  // 初始化清理功能
  // -----------------------------

  // 初始化时清理Redis数据
  async cleanupOnInit(): Promise<void> {
    try {
      const redisClient = this.getRedisClient();

      // 清理设备和用户在线集合
      await redisClient.del(this.DEVICE_ONLINE_SET, this.USER_ONLINE_SET);
      this.logger.log('已清理设备和用户在线集合');

      // 清理挂起的开锁请求
      await redisClient.del(
        this.PENDING_UNLOCK_HASH,
        this.PENDING_UNLOCK_TIME_HASH,
      );
      this.logger.log('已清理挂起的开锁请求记录');

      // 更新设备连接信息中的在线状态
      const allDeviceIds = await redisClient.hkeys(this.DEVICE_HASH);
      if (allDeviceIds.length > 0) {
        for (const deviceId of allDeviceIds) {
          try {
            const deviceInfo = JSON.parse(
              (await redisClient.hget(this.DEVICE_HASH, deviceId)) || '{}',
            );
            deviceInfo.isOnline = false;
            deviceInfo.lastDisconnect = new Date().toISOString();
            await redisClient.hset(
              this.DEVICE_HASH,
              deviceId,
              JSON.stringify(deviceInfo),
            );
          } catch (error) {
            this.logger.warn(
              `更新设备 ${deviceId} 的在线状态失败: ${error.message}`,
            );
          }
        }
        this.logger.log(`已更新 ${allDeviceIds.length} 个设备的在线状态为离线`);
      }

      // 更新用户连接信息中的在线状态
      const allUserIds = await redisClient.hkeys(this.USER_HASH);
      if (allUserIds.length > 0) {
        for (const userId of allUserIds) {
          try {
            const userInfo = JSON.parse(
              (await redisClient.hget(this.USER_HASH, userId)) || '{}',
            );
            userInfo.isOnline = false;
            userInfo.lastDisconnect = new Date().toISOString();
            await redisClient.hset(
              this.USER_HASH,
              userId,
              JSON.stringify(userInfo),
            );
          } catch (error) {
            this.logger.warn(
              `更新用户 ${userId} 的在线状态失败: ${error.message}`,
            );
          }
        }
        this.logger.log(`已更新 ${allUserIds.length} 个用户的在线状态为离线`);
      }
    } catch (error) {
      this.logger.error(`初始化清理缓存数据失败: ${error.message}`);
    }
  }
}
