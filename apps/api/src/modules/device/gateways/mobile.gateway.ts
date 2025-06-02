import { OnModuleInit } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppLoggerService } from 'src/common';

import {
  DeviceRedisService,
  UserConnectionInfo,
} from '../services/device-redis.service';

/**
 * 手机客户端WebSocket网关
 * 处理手机端WebSocket连接和消息推送
 */
@WebSocketGateway(3001, {
  cors: {
    origin: '*', // 生产环境中应该限制为特定域名
  },
  namespace: 'mobile',
})
export class MobileGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  // 存储用户ID与Socket连接的映射 (仅内存中存储，Socket对象无法序列化到Redis)
  private userConnections = new Map<string, Socket>();
  // 存储Socket ID与用户ID的映射 (仅内存中存储，用于快速查找)
  private socketToUser = new Map<string, string>();

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly deviceRedisService: DeviceRedisService,
  ) {
    this.logger.setContext(MobileGateway.name);
  }

  /**
   * 模块初始化时清理Redis中可能遗留的旧连接数据
   */
  async onModuleInit() {
    try {
      // 通过DeviceRedisService清理缓存数据
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
    const userId = client.handshake.auth.userId as string;
    // 暂时不使用token，保留注释方便未来身份验证扩展
    // const token = client.handshake.auth.token;

    // TODO: 这里应该添加身份验证逻辑
    if (!userId) {
      this.logger.warn(`拒绝未授权连接: ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      // TODO: 验证用户凭证
      this.logger.log(`用户 ${userId} 已连接: ${client.id}`);

      // 如果用户已经有连接，先断开旧连接
      const existingSocket = this.userConnections.get(userId);
      if (existingSocket) {
        this.logger.log(
          `用户 ${userId} 已有连接，断开旧连接: ${existingSocket.id}`,
        );
        existingSocket.disconnect(true);
        this.socketToUser.delete(existingSocket.id);
      }

      // 保存新连接到内存
      this.userConnections.set(userId, client);
      this.socketToUser.set(client.id, userId);

      const timestamp = new Date().toISOString();

      // 构建用户连接信息
      const userInfo: UserConnectionInfo = {
        userId,
        socketId: client.id,
        isOnline: true,
        lastConnect: timestamp,
        lastActivity: timestamp,
        ip: client.handshake.address,
        clientInfo: {
          userAgent: client.handshake.headers['user-agent'] || 'unknown',
          query: client.handshake.query,
        },
      };

      // 保存用户连接信息到Redis
      await this.deviceRedisService.saveUserConnectionInfo(userInfo);

      // 设置用户在线状态
      await this.deviceRedisService.setUserOnline(userId);
    } catch (error) {
      this.logger.error(`客户端连接处理错误: ${error.message}`);
      client.disconnect(true);
    }
  }

  /**
   * 处理客户端断开连接
   * @param client Socket客户端
   */
  async handleDisconnect(client: Socket) {
    try {
      const userId = this.socketToUser.get(client.id);
      if (userId) {
        this.logger.log(`用户 ${userId} 已断开连接: ${client.id}`);

        // 清理内存中的连接记录
        this.userConnections.delete(userId);
        this.socketToUser.delete(client.id);

        // 更新Redis中的用户状态
        try {
          // 更新用户信息为离线
          const userInfo =
            await this.deviceRedisService.getUserConnectionInfo(userId);
          if (userInfo) {
            userInfo.isOnline = false;
            userInfo.lastDisconnect = new Date().toISOString();
            await this.deviceRedisService.saveUserConnectionInfo(userInfo);
          }

          // 设置用户为离线
          await this.deviceRedisService.setUserOffline(userId);
        } catch (error) {
          this.logger.error(
            `更新用户 ${userId} 在Redis中的状态失败: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`客户端断开连接处理错误: ${error.message}`);
    }
  }

  /**
   * 处理客户端心跳
   * @param client Socket客户端
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = this.socketToUser.get(client.id);
    if (userId) {
      this.logger.debug(`接收到用户 ${userId} 的心跳`);

      try {
        // 更新用户活动时间
        await this.deviceRedisService.updateUserActivity(userId);
      } catch (error) {
        this.logger.warn(`更新用户 ${userId} 心跳信息失败: ${error.message}`);
      }
    }
    return { timestamp: new Date() };
  }

  /**
   * 向指定用户发送通知
   * @param userId 用户ID
   * @param event 事件名称
   * @param data 通知数据
   * @returns 是否发送成功
   */
  async notifyUser(
    userId: string,
    event: string,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    // 先检查Redis中的用户在线状态
    const isOnline = await this.deviceRedisService.isUserOnline(userId);
    if (!isOnline) {
      this.logger.warn(`无法发送通知: 用户 ${userId} 不在线`);
      return false;
    }

    const userSocket = this.userConnections.get(userId);
    if (!userSocket || !userSocket.connected) {
      this.logger.warn(
        `无法发送通知: 用户 ${userId} 在Redis中标记为在线，但Socket连接不可用`,
      );

      // 修正状态不一致问题
      try {
        // 获取用户连接信息
        const userInfo =
          await this.deviceRedisService.getUserConnectionInfo(userId);
        if (userInfo) {
          // 更新为离线状态
          userInfo.isOnline = false;
          userInfo.lastDisconnect = new Date().toISOString();
          await this.deviceRedisService.saveUserConnectionInfo(userInfo);
        }

        // 设置用户离线
        await this.deviceRedisService.setUserOffline(userId);
      } catch (error) {
        this.logger.error(`更新用户 ${userId} 离线状态失败: ${error.message}`);
      }

      return false;
    }

    try {
      userSocket.emit(event, data);
      this.logger.log(`已向用户 ${userId} 发送 ${event} 通知`);

      // 更新最后活动时间
      await this.deviceRedisService.updateUserActivity(userId);

      return true;
    } catch (error) {
      this.logger.error(`向用户 ${userId} 发送通知失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 向指定用户发送开锁结果通知
   * @param userId 用户ID
   * @param deviceId 设备ID
   * @param success 是否成功
   * @param message 消息
   * @returns 是否发送成功
   */
  notifyUnlockResult(
    userId: string,
    deviceId: string,
    success: boolean,
    message: string,
  ): Promise<boolean> {
    return this.notifyUser(userId, 'unlockResult', {
      deviceId,
      success,
      message,
      timestamp: new Date(),
    });
  }

  /**
   * 检查用户是否在线（使用本地Map）
   * @param userId 用户ID
   * @returns 用户在线状态
   */
  isUserOnline(userId: string): boolean {
    const socket = this.userConnections.get(userId);
    return !!(socket && socket.connected);
  }

  /**
   * 获取所有在线用户
   */
  async getAllOnlineUsers(
    limit?: number,
    withLastActivity = false,
  ): Promise<string[] | Array<{ userId: string; lastActivity: number }>> {
    return this.deviceRedisService.getAllOnlineUsers(limit, withLastActivity);
  }
}
