import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { DeviceService } from './device.service';
import { DeviceGateway } from './gateways/device.gateway';
import { DeviceStatusService } from './services/device-status.service';

/**
 * 设备管理控制器
 * 提供设备和分组管理的API接口
 */
@Controller('device')
export class DeviceController {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly deviceGateway: DeviceGateway,
    private readonly deviceStatusService: DeviceStatusService,
  ) {}

  // 设备分组管理接口
  /**
   * 获取所有设备分组
   * @route GET /device/groups
   * @returns 设备分组列表
   */
  @Get('groups')
  async getAllGroups(@Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.getAllDeviceGroups(userId);
  }

  /**
   * 创建新的设备分组
   * @route POST /device/group
   * @param body.groupName 分组名称
   * @returns 创建的分组信息
   */
  @Post('group')
  async createGroup(@Body() body: { groupName: string }, @Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.createDeviceGroup(body.groupName, userId);
  }

  /**
   * 删除设备分组
   * @route DELETE /device/group/:groupId
   * @param groupId 分组ID
   * @returns 删除的分组信息及关联的设备
   */
  @Delete('group/:groupId')
  async deleteGroup(@Param('groupId') groupId: string, @Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.deleteDeviceGroup(groupId, userId);
  }

  /**
   * 更新设备分组
   * @route PUT /device/group
   * @param body.groupName 新的分组名称
   * @param body.id 分组ID
   * @returns 更新后的分组信息
   */
  @Put('group')
  async updateGroup(
    @Body() body: { groupName: string; id: string },
    @Req() req: Request,
  ) {
    const userId = req.user.userId;
    return this.deviceService.updateDeviceGroup({
      userId,
      groupName: body.groupName,
      groupId: body.id,
    });
  }

  /**
   * 获取用户的设备列表（按分组组织）
   * @route GET /device/with-groups
   * @returns 按分组组织的设备列表
   */
  @Get('/with-groups')
  async getDevicesWithGroups(@Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.getDevicesWithGroups(userId);
  }

  // 设备管理接口
  /**
   * 绑定设备
   * @route POST /device/bind/:deviceId
   * @param deviceId 设备ID
   * @returns 绑定后的设备信息
   */
  @Post('bind/:deviceId')
  async bindDevice(@Param('deviceId') deviceId: string, @Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.bindDeviceToUser(userId, deviceId);
  }

  /**
   * 解绑设备
   * @route DELETE /device/unbind/:deviceId
   * @param deviceId 设备ID
   * @returns 解绑后的设备信息
   */
  @Delete('unbind/:deviceId')
  async unbindDevice(@Param('deviceId') deviceId: string, @Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.unbindDeviceFromUser(userId, deviceId);
  }

  /**
   * 获取用户的所有设备
   * @route GET /device/devices
   * @returns 用户的设备列表
   */
  @Get('/all')
  async getDevicesByUserId(@Req() req: Request) {
    const userId = req.user.userId;
    return this.deviceService.getDevicesByUserId(userId);
  }

  /**
   * 获取单个设备详细信息
   * @route GET /device/:deviceId
   * @param deviceId 设备ID
   * @returns 设备详细信息
   */
  @Get(':deviceId')
  async getDeviceInfo(@Param('deviceId') deviceId: string) {
    return this.deviceService.getDeviceInfo(deviceId);
  }

  /**
   * 获取指定分组中的设备列表
   * @route GET /device/group/:groupId
   * @param groupId 分组ID
   * @returns 该分组下的设备列表
   */
  @Get('group/:groupId')
  async getDevicesByGroupId(@Param('groupId') groupId: string) {
    return this.deviceService.getDevicesByGroupId(groupId);
  }

  /**
   * 远程开锁
   * @route POST /device/unlock/:deviceId
   * @param deviceId 设备ID
   * @param body.requireImage 是否需要设备拍摄图片，默认为true
   * @returns 开锁结果
   * @description
   * 该接口会立即返回开锁命令已发送的结果，实际的开锁操作由设备执行。
   * 设备执行开锁后，会通过WebSocket将结果发送到服务器，服务器会将结果推送到手机端。
   * 手机端需要通过WebSocket连接监听 'unlockResult' 事件来获取开锁结果。
   * 如果requireImage为true，设备还会拍摄图片并发送回来，图片会保存到开锁记录中。
   */
  @Post('unlock/:deviceId')
  async remoteUnlock(
    @Param('deviceId') deviceId: string,
    @Req() req: Request,
    @Body() body: { requireImage?: boolean } = {},
  ) {
    const userId = req.user.userId;
    const requireImage = body.requireImage !== false; // 默认为true

    // 发送开锁命令
    const unlockResult = await this.deviceGateway.sendUnlockCommand(
      deviceId,
      userId,
      requireImage,
    );

    if (unlockResult) {
      return { success: true, message: '开锁命令已发送，请等待设备反馈结果' };
    } else {
      return { success: false, message: '开锁命令发送失败，请稍后重试' };
    }
  }
}
