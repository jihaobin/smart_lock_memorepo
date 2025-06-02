import { OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { DeviceStatus } from '@smart-lock/shared';
import * as sharp from 'sharp';
import { Server, Socket } from 'socket.io';
import { AppLoggerService } from 'src/common';
import { UnLockRecordService } from 'src/modules/unLockRecord/unLockRecord.service';

import { DeviceService } from '../device.service';
import { MobileGateway } from './mobile.gateway';
import {
  DeviceConnectionInfo,
  DeviceRedisService,
} from '../services/device-redis.service';
import { DeviceStatusService } from '../services/device-status.service';

/**
 * 设备WebSocket网关
 * 处理设备WebSocket连接和消息
 */
@WebSocketGateway(3001, {
  cors: {
    origin: '*', // 生产环境中应该限制为特定域名
  },
  namespace: 'devices',
})
export class DeviceGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  // 存储设备ID与Socket连接的映射 (仅内存中存储，Socket对象无法序列化到Redis)
  private deviceConnections = new Map<string, Socket>();
  // 存储Socket ID与设备ID的映射 (仅内存中存储，用于快速查找)
  private socketToDevice = new Map<string, string>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly deviceService: DeviceService,
    private readonly logger: AppLoggerService,
    private readonly mobileGateway: MobileGateway,
    private readonly deviceRedisService: DeviceRedisService,
    private readonly deviceStatusService: DeviceStatusService,
    private readonly unLockRecordService: UnLockRecordService,
  ) {
    this.logger.setContext(DeviceGateway.name);
  }

  /**
   * 模块初始化时清理Redis中可能遗留的旧连接数据
   */
  async onModuleInit() {
    try {
      await this.deviceRedisService.cleanupOnInit();
    } catch (error) {
      this.logger.error(`初始化清理缓存数据失败: ${error.message}`);
    }
  }

  /**
   * 处理客户端连接
   * @param client Socket客户端
   */
  async handleConnection(client: Socket) {
    const deviceId = client.handshake.auth.deviceId as string;
    const isMobile = client.handshake.auth.isMobile;
    const userId = client.handshake.auth.userId as string;
    // 暂时不使用token，保留注释方便未来身份验证扩展
    // const token = client.handshake.auth.token;

    // 如果是移动端连接，则发送设备状态
    if (isMobile) {
      this.logger.log(`移动端连接: ${client.id}`);

      try {
        // 获取用户所有设备
        const userDevices = await this.deviceService.getDevicesByUserId(userId);
        if (!userDevices) {
          client.emit('getUserDevicesStatus', {
            success: false,
            message: '无法获取用户设备列表',
          });
          return;
        }

        // 提取设备ID列表
        const userDeviceIds = userDevices.map((device) => device.id);

        // 获取在线设备集合
        const onlineDevices =
          (await this.deviceRedisService.getAllOnlineDevices()) as string[];
        // 如果是纯字符串数组
        const onlineDeviceIds = onlineDevices as string[];
        const statusMap = userDeviceIds.reduce((acc, deviceId) => {
          acc[deviceId] = {
            isOnline: onlineDeviceIds.includes(deviceId),
            isOpen: false,
            batteryLevel: 0, // 默认值
            firmwareVersion: 0, // 默认值
            lastConnectionTime: '', // 默认值
            connectionId: '', // 默认值
          };
          return acc;
        }, {});

        // 并行获取所有设备状态
        await Promise.all(
          userDeviceIds.map(async (deviceId) => {
            const image =
              await this.deviceRedisService.getDeviceImage(deviceId);
            const deviceStatus =
              (await this.deviceStatusService.getDeviceStatus(
                deviceId,
              )) as DeviceStatus;
            if (deviceStatus) {
              statusMap[deviceId] = {
                ...deviceStatus,
                isOnline: onlineDeviceIds.includes(deviceId),
                image,
              };
            }
          }),
        );
        client.emit('getUserDevicesStatus', { success: true, data: statusMap });
      } catch (error) {
        this.logger.error(`获取用户设备状态失败: ${error.message}`);
        client.emit('getUserDevicesStatus', {
          success: false,
          message: error.message,
        });
      }
      return;
    }

    if (!isMobile) {
      // TODO: 这里应该添加身份验证逻辑
      if (!deviceId) {
        this.logger.warn(`拒绝未授权连接: ${client.id} device Socket`);
        client.disconnect(true);
        return;
      }

      try {
        // TODO: 验证设备凭证
        this.logger.log(`设备 ${deviceId} 已连接: ${client.id}`);

        // 在内存中保存设备连接
        this.deviceConnections.set(deviceId, client);
        this.socketToDevice.set(client.id, deviceId);

        const timestamp = new Date().toISOString();

        // 构建设备连接信息
        const deviceInfo: DeviceConnectionInfo = {
          deviceId,
          socketId: client.id,
          isOnline: true,
          lastConnect: timestamp,
          lastActivity: timestamp,
          ip: client.handshake.address,
        };

        // 保存设备连接信息
        await this.deviceRedisService.saveDeviceConnectionInfo(deviceInfo);

        // 设置设备在线状态
        await this.deviceRedisService.setDeviceOnline(deviceId);

        // 更新设备在数据库中的在线状态
        await this.deviceService.updateDeviceOnlineStatus(
          deviceId,
          true,
          client.id,
        );

        // 广播设备上线通知
        this.server.emit('deviceStatusChanged', {
          deviceId,
          isOnline: true,
          timestamp: new Date(),
        });
      } catch (error) {
        this.logger.error(`设备连接处理错误: ${error.message}`);
        client.disconnect(true);
      }
    }
  }

  /**
   * 处理客户端断开连接
   * @param client Socket客户端
   */
  async handleDisconnect(client: Socket) {
    try {
      const deviceId = this.socketToDevice.get(client.id);
      if (deviceId) {
        this.logger.log(`设备 ${deviceId} 已断开连接: ${client.id}`);

        // 清理内存中的连接记录
        this.deviceConnections.delete(deviceId);
        this.socketToDevice.delete(client.id);

        // 从Redis中更新设备状态
        try {
          // 更新设备连接信息
          const deviceInfo =
            await this.deviceRedisService.getDeviceConnectionInfo(deviceId);
          if (deviceInfo) {
            deviceInfo.isOnline = false;
            deviceInfo.lastDisconnect = new Date().toISOString();
            await this.deviceRedisService.saveDeviceConnectionInfo(deviceInfo);
          }

          // 设置设备离线
          await this.deviceRedisService.setDeviceOffline(deviceId);

          // 更新设备状态
          await this.deviceStatusService.updateDeviceStatus(deviceId, {
            isOnline: false,
            lastConnectionTime: new Date().toISOString(),
            connectionId: undefined,
          });

          // 检查是否有未完成的开锁请求，如果有则通知失败
          const unlockRequest =
            await this.deviceRedisService.getPendingUnlockRequest(deviceId);
          if (unlockRequest) {
            this.mobileGateway.notifyUnlockResult(
              unlockRequest.userId,
              deviceId,
              false,
              '设备断开连接，开锁操作已中断',
            );
            await this.deviceRedisService.deletePendingUnlockRequest(deviceId);
          }
        } catch (error) {
          this.logger.error(
            `更新设备 ${deviceId} 在Redis中的状态失败: ${error.message}`,
          );
        }

        // 广播设备离线通知
        this.server.emit('deviceStatusChanged', {
          deviceId,
          isOnline: false,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`设备断开连接处理错误: ${error.message}`);
    }
  }

  /**
   * 处理设备状态更新消息
   * @param client Socket客户端
   * @param data 设备状态数据
   */
  @SubscribeMessage('updateDeviceStatus')
  async handleUpdateDeviceStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: DeviceStatus,
  ) {
    const deviceId = this.socketToDevice.get(client.id);
    if (!deviceId) {
      return { success: false, message: '未认证的设备' };
    }

    this.logger.log(`设备 ${deviceId} 状态更新: ${JSON.stringify(data)}`);

    try {
      // 检查锁状态变更
      let previousLockStatus: boolean | undefined;
      let previousLockBattery: number | undefined;

      // 获取当前设备状态
      const deviceStatus =
        await this.deviceStatusService.getDeviceStatus(deviceId);
      if (deviceStatus) {
        // 获取之前的锁状态
        previousLockStatus = deviceStatus.isOpen;
        previousLockBattery = deviceStatus.batteryLevel;
      }

      // 更新设备状态
      // 判断data中是否包含lockStatus字段，如果有，则需要转换为isOpen
      let updateData: DeviceStatus = { ...data };

      // 更新设备活动时间
      updateData.lastConnectionTime = new Date().toISOString();

      // 使用设备状态服务更新
      await this.deviceStatusService.updateDeviceStatus(deviceId, updateData);

      // 检查锁状态是否变更
      if ('isOpen' in updateData) {
        const newLockStatus = updateData.isOpen;
        if (newLockStatus !== previousLockStatus) {
          this.server.emit('deviceLockStatusChanged', {
            deviceId,
            lockStatus: newLockStatus,
            timestamp: new Date(),
          });
          this.logger.log(`设备 ${deviceId} 锁状态变更为 ${newLockStatus}`);
        }
      }

      // 检查电池电量是否变更
      if ('batteryLevel' in updateData) {
        const newBatteryLevel = updateData.batteryLevel;
        if (newBatteryLevel !== previousLockBattery) {
          this.server.emit('deviceBatteryLevelChanged', {
            deviceId,
            batteryLevel: newBatteryLevel,
            timestamp: new Date(),
          });
          this.logger.log(`设备 ${deviceId} 电池电量变更为 ${newBatteryLevel}`);
        }
      }

      // 更新在线设备集合的时间戳
      await this.deviceRedisService.setDeviceOnline(deviceId);

      return {
        success: true,
        message: '状态已更新',
      };
    } catch (error) {
      this.logger.error(`更新设备状态失败: ${error.message}`);
      return {
        success: false,
        message: '状态更新失败',
      };
    }
  }

  /**
   * 处理设备开锁结果
   * @param client Socket客户端
   * @param data 开锁结果数据
   */
  @SubscribeMessage('unlockResult')
  async handleUnlockResult(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { success: boolean; message: string; requestId?: string },
  ) {
    const deviceId = this.socketToDevice.get(client.id);
    if (!deviceId) {
      return { success: false, message: '未认证的设备' };
    }

    this.logger.log(`设备 ${deviceId} 开锁结果: ${JSON.stringify(data)}`);

    // 查找对应的开锁请求
    const unlockRequest =
      await this.deviceRedisService.getPendingUnlockRequest(deviceId);
    if (unlockRequest) {
      this.logger.debug(
        `找到待处理的开锁请求: 设备ID=${deviceId}, 用户ID=${unlockRequest.userId}`,
      );

      // 推送开锁结果到手机客户端
      this.mobileGateway.notifyUnlockResult(
        unlockRequest.userId,
        deviceId,
        data.success,
        data.message || (data.success ? '开锁成功' : '开锁失败'),
      );

      // 获取当前请求的requestId
      const requestId =
        data.requestId ||
        (await this.deviceRedisService.getDeviceRequestId(deviceId));

      // 获取设备图片（如果有）
      let remoteImage: string | null = null;
      if (requestId) {
        // 先尝试通过requestId获取关联图片
        remoteImage = await this.deviceRedisService.getDeviceImage(
          deviceId,
          requestId,
        );
        this.logger.debug(
          `尝试获取请求ID ${requestId} 关联的图片: ${remoteImage ? '成功' : '失败'}`,
        );
      }

      // 如果通过requestId未找到图片，尝试获取未关联的图片
      if (!remoteImage) {
        remoteImage = await this.deviceRedisService.getDeviceImage(deviceId);
        if (remoteImage) {
          this.logger.debug(
            `找到设备 ${deviceId} 的未关联开锁图片，将保存到开锁记录中`,
          );
        } else {
          // 如果仍未找到图片，可以设置一个短暂的等待以接收可能延迟到达的图片
          this.logger.debug(`未找到设备 ${deviceId} 的图片，等待3秒后再次尝试`);
          await new Promise((resolve) => setTimeout(resolve, 3000));

          // 再次尝试获取图片
          if (requestId) {
            remoteImage = await this.deviceRedisService.getDeviceImage(
              deviceId,
              requestId,
            );
          }
          if (!remoteImage) {
            remoteImage =
              await this.deviceRedisService.getDeviceImage(deviceId);
          }
        }
      }

      // 记录开锁结果到数据库
      await this.unLockRecordService.createUnlockRecord({
        deviceId,
        userId: unlockRequest.userId,
        unlockType: 'remote',
        unlockData: {
          isRemoteSuccess: data.success,
          remoteImage: remoteImage || undefined,
        },
      });

      // 清理资源
      if (requestId) {
        await this.deviceRedisService.deleteDeviceImage(deviceId, requestId);
      } else {
        await this.deviceRedisService.deleteDeviceImage(deviceId);
      }

      // 清理挂起的请求
      await this.deviceRedisService.deletePendingUnlockRequest(deviceId);
    } else {
      this.logger.warn(`收到设备 ${deviceId} 开锁结果，但未找到对应的请求记录`);
    }

    return {
      success: true,
      message: '结果已接收',
    };
  }

  /**处理设备发送的摄像头图片
   * @param client Socket客户端
   * @param data 图片数据 Bold
   */
  @SubscribeMessage('deviceImage')
  async handleDeviceImage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    const deviceId = this.socketToDevice.get(client.id);
    if (!deviceId) {
      return { success: false, message: '未认证的设备' };
    }

    try {
      // 检查是否是新格式的数据（包含image和requestId）
      const imageData = Buffer.isBuffer(data) ? data : data.image;
      const requestId =
        !Buffer.isBuffer(data) && data.requestId ? data.requestId : null;

      // 压缩并转换图片为base64格式
      const base64Image = (
        await sharp(imageData).avif({ quality: 70 }).toBuffer()
      ).toString('base64');

      // 广播图片到客户端
      this.server.emit('sendDeviceImage', {
        deviceId,
        image: `data:image/avif;base64,${base64Image}`,
        timestamp: new Date(),
        requestId,
      });

      // 如果有requestId，直接使用它保存图片
      if (requestId) {
        await this.deviceRedisService.saveDeviceImage(
          deviceId,
          requestId,
          base64Image,
          60,
        );
        this.logger.log(
          `设备 ${deviceId} 图片已保存，与请求ID ${requestId} 关联`,
        );
        return { success: true, message: '图片已接收并关联到请求' };
      }

      // 尝试获取当前请求的requestId
      const currentRequestId =
        await this.deviceRedisService.getDeviceRequestId(deviceId);
      if (currentRequestId) {
        await this.deviceRedisService.saveDeviceImage(
          deviceId,
          currentRequestId,
          base64Image,
          60,
        );
        this.logger.log(
          `设备 ${deviceId} 图片已保存，关联到请求ID: ${currentRequestId}`,
        );
      } else {
        // 找不到requestId，使用旧方式保存
        await this.deviceRedisService.saveDeviceImage(
          deviceId,
          '',
          base64Image,
          60,
        );
        this.logger.log(`设备 ${deviceId} 图片已保存，但无法关联到特定请求`);
      }

      return { success: true, message: '图片已接收' };
    } catch (error) {
      this.logger.error(`处理设备图片失败: ${error.message}`);
      return { success: false, message: '图片处理失败' };
    }
  }

  /**
   * 向指定设备发送远程开锁命令
   * @param deviceId 设备ID
   * @param userId 用户ID
   * @param requireImage 是否需要设备拍摄图片
   * @returns 发送结果
   */
  async sendUnlockCommand(
    deviceId: string,
    userId: string,
    requireImage: boolean = true,
  ): Promise<boolean> {
    // 检查设备是否在线
    const isOnline = await this.deviceRedisService.isDeviceOnline(deviceId);
    if (!isOnline) {
      this.logger.warn(`无法发送开锁命令: 设备 ${deviceId} 不在线`);

      // 设备不在线，通知手机端
      this.mobileGateway.notifyUnlockResult(
        userId,
        deviceId,
        false,
        '设备当前不在线，无法执行开锁操作',
      );

      return false;
    }

    // 检查锁状态，如果已经是开启状态，则不再执行开锁
    const lockStatus = await this.getDeviceLockStatus(deviceId);
    if (lockStatus) {
      this.logger.warn(`无法发送开锁命令: 设备 ${deviceId} 已处于开启状态`);

      // 通知手机端
      this.mobileGateway.notifyUnlockResult(
        userId,
        deviceId,
        false,
        '门锁已处于开启状态，无需再次开锁',
      );

      return false;
    }

    const deviceSocket = this.deviceConnections.get(deviceId);
    if (!deviceSocket || !deviceSocket.connected) {
      this.logger.warn(
        `无法发送开锁命令: 设备 ${deviceId} 在Redis中标记为在线，但Socket连接不可用`,
      );

      // 设备连接不可用，更新状态
      await this.deviceStatusService.updateDeviceStatus(deviceId, {
        isOnline: false,
        lastConnectionTime: new Date().toISOString(),
        connectionId: undefined,
      });

      // 设置设备离线
      await this.deviceRedisService.setDeviceOffline(deviceId);

      this.mobileGateway.notifyUnlockResult(
        userId,
        deviceId,
        false,
        '设备连接状态异常，无法执行开锁操作',
      );

      return false;
    }

    try {
      // 生成请求ID
      const requestId =
        await this.deviceRedisService.createPendingUnlockRequest(
          deviceId,
          userId,
        );

      const unlockData = {
        command: 'unlock',
        userId,
        timestamp: new Date(),
        requireImage,
        requestId, // 添加请求ID
      };

      // 记录此次开锁请求到Redis
      await this.deviceRedisService.createPendingUnlockRequest(
        deviceId,
        userId,
      );

      // 发送命令并等待确认
      const response = await deviceSocket
        .timeout(5000)
        .emitWithAck('command', unlockData);

      this.logger.log(
        `设备 ${deviceId} 开锁命令响应: ${JSON.stringify(response)}`,
      );

      return response && response.success === true;
    } catch (error) {
      console.log(error);
      this.logger.error(`发送开锁命令失败: ${error}`);

      // 发送失败，通知手机端
      this.mobileGateway.notifyUnlockResult(
        userId,
        deviceId,
        false,
        `开锁命令发送失败: ${error}`,
      );

      // 清理挂起的请求
      await this.deviceRedisService.deletePendingUnlockRequest(deviceId);

      return false;
    }
  }

  /**
   * 获取设备锁状态
   * @param deviceId 设备ID
   * @returns 锁状态：'locked'(已锁定)、'unlocked'(已开启)或null(获取失败)
   */
  async getDeviceLockStatus(deviceId: string): Promise<boolean | null> {
    try {
      // 使用设备状态服务获取状态
      const deviceStatus =
        await this.deviceStatusService.getDeviceStatus(deviceId);
      if (!deviceStatus) return null;

      // 根据isOpen字段判断锁状态
      return deviceStatus.isOpen;
    } catch (error) {
      this.logger.error(`获取设备 ${deviceId} 锁状态失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取所有在线设备
   */
  async getAllOnlineDevices(
    limit?: number,
    withLastActivity = false,
  ): Promise<string[] | Array<{ deviceId: string; lastActivity: number }>> {
    return this.deviceRedisService.getAllOnlineDevices(limit, withLastActivity);
  }
}
