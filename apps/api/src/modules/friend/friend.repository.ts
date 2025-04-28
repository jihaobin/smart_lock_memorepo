import { Inject, Injectable } from '@nestjs/common';
import {
  CreateFriendSchemaType,
  DbType,
  UpdateFriendSchemaType,
} from '@smart-lock/shared';
import { schema } from '@smart-lock/shared/server';
import { and, eq } from 'drizzle-orm';
import { DB } from 'src/database/database.provider';

/**
 * 朋友关系管理仓库层
 * 负责好友数据和分组的数据库操作
 */
@Injectable()
export class FriendRepository {
  @Inject(DB) db: DbType;

  // 分组管理方法
  /**
   * 创建新的好友分组
   * @param groupName 分组名称
   * @param userId 用户ID
   * @returns 创建的分组信息
   */
  async createGroup(groupName: string, userId: string) {
    const groupInfo = await this.db
      .insert(schema.friendGroups)
      .values({
        groupName: groupName,
        userId: userId,
      })
      .returning();

    return groupInfo;
  }

  /**
   * 获取全部好友分组
   * @param userId 可选的用户ID过滤
   * @returns 好友分组列表
   */
  async getAllGroups(userId: string) {
    const groups = await this.db.query.friendGroups.findMany({
      where: eq(schema.friendGroups.userId, userId),
      columns: {
        id: true,
        groupName: true,
      },
    });

    return groups;
  }

  /**
   * 删除好友分组
   * 同时删除该分组下的所有好友关系
   * @param groupId 分组ID
   * @returns 删除的分组和好友信息
   */
  async deleteGroup(groupId: string) {
    // 删除组的同时，删除这个组中的所有好友的信息
    return await this.db.transaction(async (tx) => {
      // 1. 删除该分组下的所有好友
      const deletedFriends = await tx
        .delete(schema.friends)
        .where(eq(schema.friends.friendGroupId, groupId))
        .returning();

      // 2. 删除分组本身
      const deletedGroup = await tx
        .delete(schema.friendGroups)
        .where(eq(schema.friendGroups.id, groupId))
        .returning();

      return {
        group: deletedGroup,
        friends: deletedFriends,
      };
    });
  }

  /**
   * 更新好友分组信息
   * @param userId 用户ID
   * @param groupName 新的分组名称
   * @returns 更新后的分组信息
   */
  async updateFriendGroup(groupData: {
    userId: string;
    groupName: string;
    groupId: string;
  }) {
    return await this.db
      .update(schema.friendGroups)
      .set({ groupName: groupData.groupName })
      .where(
        and(
          eq(schema.friendGroups.userId, groupData.userId),
          eq(schema.friendGroups.id, groupData.groupId),
        ),
      )
      .returning();
  }

  // 好友管理方法
  /**
   * 添加好友
   * @param friendInfo 好友信息，包括名称、用户ID和分组ID
   * @returns 创建的好友信息
   */
  async addFriend(
    friendInfo: Required<CreateFriendSchemaType> & { userId: string },
  ) {
    // 添加好友，并且将其放入对应的分组中
    return await this.db.transaction(async (tx) => {
      const friend = await tx
        .insert(schema.friends)
        .values({
          userId: friendInfo.userId,
          remarkName: friendInfo.remarkName,
          linkedPasswords: friendInfo.linkedPasswords,
          friendGroupId: friendInfo.friendGroupId,
        })
        .returning();

      return friend;
    });
  }

  /**
   * 删除好友关系
   * @param friendId 好友关系ID
   * @returns 删除的好友信息
   */
  async deleteFriend(friendId: string) {
    return await this.db
      .delete(schema.friends)
      .where(eq(schema.friends.id, friendId))
      .returning();
  }

  /**
   * 更新好友信息
   * @param updateData 好友更新数据
   * @returns 更新后的好友信息
   */
  async updateFriend(updateData: UpdateFriendSchemaType) {
    return await this.db
      .update(schema.friends)
      .set({
        remarkName: updateData.remarkName,
        linkedPasswords: updateData.linkedPasswords,
        friendGroupId: updateData.friendGroupId,
      })
      .where(
        and(
          eq(schema.friends.friendGroupId, updateData.friendGroupId),
          eq(schema.friends.id, updateData.id),
        ),
      )
      .returning();
  }

  /**
   * 获取单个好友详细信息
   * @param friendId 好友关系ID
   * @returns 好友信息，包括所属分组
   */
  async getFriendInfo(friendId: string) {
    return await this.db.query.friends.findFirst({
      where: eq(schema.friends.id, friendId),
      with: {
        friendGroup: true,
      },
    });
  }

  /**
   * 获取指定分组中的好友列表
   * @param groupId 分组ID
   * @returns 该分组下的好友列表
   */
  async getFriendsByGroupId(groupId: string) {
    return await this.db.query.friends.findMany({
      where: eq(schema.friends.friendGroupId, groupId),
      orderBy: schema.friends.remarkName,
    });
  }

  /**
   * 获取用户的所有好友
   * @param userId 用户ID
   * @param includeGroups 是否包含分组信息
   * @returns 用户的好友列表
   */
  async getFriendsByUserId(userId: string, includeGroups: boolean = true) {
    if (includeGroups) {
      // 如果需要包含分组信息，直接返回朋友列表及其所属分组
      return await this.db.query.friends.findMany({
        where: eq(schema.friends.userId, userId),
        with: {
          friendGroup: true,
        },
        orderBy: schema.friends.remarkName,
      });
    } else {
      // 如果不需要分组信息，只返回朋友列表
      return await this.db.query.friends.findMany({
        where: eq(schema.friends.userId, userId),
        orderBy: schema.friends.remarkName,
      });
    }
  }

  /**
   * 获取用户的好友列表（按分组组织）
   * @param userId 用户ID
   * @returns 按分组组织的好友列表
   */
  async getFriendsWithGroups(userId: string) {
    // 按分组返回朋友列表
    return await this.db.query.friendGroups.findMany({
      where: eq(schema.friendGroups.userId, userId),
      with: {
        friends: true,
      },
    });
  }
}
