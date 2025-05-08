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

/**
 * 设备管理控制器
 * 提供设备和分组管理的API接口
 */
@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

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
}
