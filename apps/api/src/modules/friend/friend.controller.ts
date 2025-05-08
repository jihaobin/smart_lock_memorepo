import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UsePipes,
} from '@nestjs/common';
import {
  createFriendSchema,
  CreateFriendSchemaType,
  updateFriendSchema,
  UpdateFriendSchemaType,
} from '@smart-lock/shared';
import { Request } from 'express';
import { ZodValidationPipe } from 'src/common/pipes';

import { FriendService } from './friend.service';

/**
 * 好友关系管理控制器
 * 提供好友和分组管理的API接口
 */
@Controller('friend')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  // 分组管理接口
  /**
   * 获取所有好友分组
   * @route GET /friend/groups
   * @param userId 可选的用户ID过滤
   * @returns 好友分组列表
   */
  @Get('groups')
  async getAllGroups(@Req() req: Request) {
    const userId = req.user.userId;
    return this.friendService.getAllGroups(userId);
  }

  /**
   * 创建新的好友分组
   * @route POST /friend/group
   * @param body.groupName 分组名称
   * @param body.userId 用户ID
   * @returns 创建的分组信息
   */
  @Post('group')
  async createGroup(@Body() body: { groupName: string }, @Req() req: Request) {
    const userId = req.user.userId;
    return this.friendService.createGroup(body.groupName, userId);
  }

  /**
   * 删除好友分组
   * @route DELETE /friend/group/:groupId
   * @param groupId 分组ID
   * @returns 删除的分组信息及关联的好友
   */
  @Delete('group/:groupId')
  async deleteGroup(@Param('groupId') groupId: string) {
    return this.friendService.deleteGroup(groupId);
  }

  /**
   * 更新好友分组
   * @route PUT /friend/group
   * @param body.userId 用户ID
   * @param body.groupName 新的分组名称
   * @returns 更新后的分组信息
   */
  @Put('group')
  async updateGroup(
    @Body() body: { groupName: string; id: string },
    @Req() req: Request,
  ) {
    const userId = req.user.userId;
    return this.friendService.updateGroup({
      userId,
      groupName: body.groupName,
      groupId: body.id,
    });
  }

  /**
   * 获取用户的好友列表（按分组组织）
   * @route GET /friend/user/:userId/with-groups
   * @param userId 用户ID
   * @returns 按分组组织的好友列表
   */
  @Get('/with-groups')
  async getFriendsWithGroups(@Req() req: Request) {
    const userId = req.user.userId;
    return this.friendService.getFriendsWithGroups(userId);
  }

  // 好友管理接口
  /**
   * 添加好友
   * @route POST /friend
   * @param friendInfo 好友信息，包括名称、用户ID和分组ID
   * @returns 创建的好友信息
   */
  @UsePipes(new ZodValidationPipe(createFriendSchema))
  @Post()
  async addFriend(
    @Req() req: Request,
    @Body() friendInfo: Required<CreateFriendSchemaType>,
  ) {
    const userId = req.user.userId;
    return this.friendService.addFriend({
      ...friendInfo,
      userId,
    });
  }

  /**
   * 删除好友信息
   * @route DELETE /friend/:friendId
   * @param friendId 好友关系ID
   * @returns 删除的好友信息
   */
  @Delete(':friendId')
  async deleteFriend(@Param('friendId') friendId: string) {
    return this.friendService.deleteFriend(friendId);
  }

  /**
   * 更新好友信息
   * @route PUT /friend
   * @param updateData 好友更新数据
   * @returns 更新后的好友信息
   */
  @UsePipes(new ZodValidationPipe(updateFriendSchema))
  @Put()
  async updateFriend(@Body() updateData: UpdateFriendSchemaType) {
    return await this.friendService.updateFriend(updateData);
  }

  /**
   * 获取用户的所有好友
   * @route GET /friend/user/:userId/friends
   * @param userId 用户ID
   * @returns 用户的好友列表
   */
  @Get('/Allfriends')
  async getFriendsByUserId(@Req() req: Request) {
    const userId = req.user.userId;
    return this.friendService.getFriendsByUserId(userId, false);
  }

  /**
   * 获取单个好友详细信息
   * @route GET /friend/:friendId
   * @param friendId 好友关系ID
   * @returns 好友详细信息
   */
  @Get(':friendId')
  async getFriendInfo(@Param('friendId') friendId: string) {
    return this.friendService.getFriendInfo(friendId);
  }

  /**
   * 获取指定分组中的好友列表
   * @route GET /friend/group/:groupId/friends
   * @param groupId 分组ID
   * @returns 该分组下的好友列表
   */
  @Get('group/:groupId')
  async getFriendsByGroupId(@Param('groupId') groupId: string) {
    return this.friendService.getFriendsByGroupId(groupId);
  }
}
