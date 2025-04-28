import { Injectable } from '@nestjs/common';
import {
  CreateFriendSchemaType,
  UpdateFriendSchemaType,
} from '@smart-lock/shared';

import { FriendRepository } from './friend.repository';

/**
 * 好友关系管理服务
 * 处理好友关系和分组的业务逻辑
 */
@Injectable()
export class FriendService {
  constructor(private readonly friendRepository: FriendRepository) {}

  /**
   * 获取所有好友分组
   * @param userId 可选的用户ID过滤
   * @returns 好友分组列表
   */
  async getAllGroups(userId: string) {
    return await this.friendRepository.getAllGroups(userId);
  }

  /**
   * 创建新的好友分组
   * @param groupName 分组名称
   * @param userId 用户ID
   * @returns 创建的分组信息
   */
  async createGroup(groupName: string, userId: string) {
    return this.friendRepository.createGroup(groupName, userId);
  }

  /**
   * 删除好友分组
   * @param groupId 分组ID
   * @returns 删除的分组信息及关联的好友
   */
  async deleteGroup(groupId: string) {
    return this.friendRepository.deleteGroup(groupId);
  }

  /**
   * 更新好友分组
   * @param userId 用户ID
   * @param groupName 新的分组名称
   * @returns 更新后的分组信息
   */
  async updateGroup(groupData: {
    userId: string;
    groupName: string;
    groupId: string;
  }) {
    return await this.friendRepository.updateFriendGroup(groupData);
  }

  // 好友管理
  /**
   * 添加好友
   * @param friendInfo 好友信息，包括名称、用户ID和分组ID
   * @returns 创建的好友信息
   */
  async addFriend(
    friendInfo: Required<CreateFriendSchemaType> & { userId: string },
  ) {
    return this.friendRepository.addFriend(friendInfo);
  }

  /**
   * 删除好友关系
   * @param friendId 好友关系ID
   * @returns 删除的好友信息
   */
  async deleteFriend(friendId: string) {
    return this.friendRepository.deleteFriend(friendId);
  }

  /**
   * 更新好友信息
   * @param update 好友更新数据
   * @returns 更新后的好友信息
   */
  async updateFriend(update: UpdateFriendSchemaType) {
    return await this.friendRepository.updateFriend(update);
  }

  /**
   * 获取单个好友详细信息
   * @param friendId 好友关系ID
   * @returns 好友信息，包括所属分组
   */
  async getFriendInfo(friendId: string) {
    return this.friendRepository.getFriendInfo(friendId);
  }

  /**
   * 获取指定分组中的好友列表
   * @param groupId 分组ID
   * @returns 该分组下的好友列表
   */
  async getFriendsByGroupId(groupId: string) {
    return this.friendRepository.getFriendsByGroupId(groupId);
  }

  /**
   * 获取用户的所有好友
   * @param userId 用户ID
   * @param includeGroups 是否包含分组信息
   * @returns 用户的好友列表
   */
  async getFriendsByUserId(userId: string, includeGroups: boolean = true) {
    return this.friendRepository.getFriendsByUserId(userId, includeGroups);
  }

  /**
   * 获取用户的好友列表（按分组组织）
   * @param userId 用户ID
   * @returns 按分组组织的好友列表
   */
  async getFriendsWithGroups(userId: string) {
    return this.friendRepository.getFriendsWithGroups(userId);
  }
}
