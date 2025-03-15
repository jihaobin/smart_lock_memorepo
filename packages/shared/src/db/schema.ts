// schema.ts
import { init } from '@paralleldrive/cuid2';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  primaryKey,
  char,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

const createId = init({
  length: 5,
});

// --------------------------
// 核心表定义
// --------------------------

/** 用户表 */
export const users = pgTable(
  'users',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: text('password_hash').notNull(),
    qrCode: text('qr_code'), // 个人名片二维码
    createdAt: timestamp('created_at').defaultNow(),
  },
  table => [
    uniqueIndex('users_email_idx').on(table.email),
    index('users_qr_code_idx').on(table.qrCode),
  ]
);

/** 设备表 */
export const devices = pgTable(
  'devices',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    ownerId: char('owner_id', { length: 5 }).notNull(), // 关联用户
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 设备类型（如门锁型号）
    status: jsonb('status')
      .$type<{
        batteryLevel: number;
        firmwareVersion: string;
      }>()
      .notNull(), // 设备状态
    hasCamera: boolean('has_camera').default(false),
  },
  table => [
    index('devices_owner_type_idx').on(table.ownerId, table.type), // 复合索引优化按所有者查询设备列表
    index('devices_status_idx').on(table.status),
  ]
);

/** 设备分组表 */
export const deviceGroups = pgTable(
  'device_groups',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    userId: char('user_id', { length: 5 }).notNull(), // 所属用户
    name: varchar('name', { length: 255 }).notNull(),
  },
  table => [
    index('device_groups_user_name_idx').on(table.userId, table.name), // 优化用户分组查询
  ]
);

/** 用户好友分组表 */
export const friendGroups = pgTable(
  'friend_groups',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    userId: char('user_id', { length: 5 }).notNull(), // 所属用户
    groupName: varchar('group_name', { length: 255 }).notNull(),
  },
  table => [uniqueIndex('friend_groups_user_name_idx').on(table.userId, table.groupName)]
);

/** 好友表（备注系统） */
export const friends = pgTable(
  'friends',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    userId: char('user_id', { length: 5 }).notNull(), // 所属用户
    remarkName: varchar('remark_name', { length: 255 }).notNull(),
    linkedPasswords: jsonb('linked_passwords').$type<string[]>().default([]), // 关联的临时密码
  },
  table => [
    index('friends_user_idx').on(table.userId),
    index('friends_remark_name_idx').on(table.remarkName),
  ]
);

/** 临时密码表 */
export const temporaryPasswords = pgTable(
  'temporary_passwords',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    creatorId: char('creator_id', { length: 5 }).notNull(), // 创建者
    deviceId: char('device_id', { length: 5 }).notNull(), // 关联设备
    password: varchar('password', { length: 50 }).notNull(),
    expiresAt: timestamp('expires_at'), // 时间过期
    remainingUses: integer('remaining_uses'), // 剩余次数
    recipients: jsonb('recipients').$type<string[]>().default([]), // 接收人列表
  },
  table => [
    index('temp_pass_device_expires_idx').on(table.deviceId, table.expiresAt.desc()), // 优化密码过期查询，按过期时间倒序
    index('temp_pass_creator_idx').on(table.creatorId),
  ]
);

/** 开锁记录表 */
export const unlockRecords = pgTable(
  'unlock_records',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    deviceId: char('device_id', { length: 5 }).notNull(), // 关联设备
    userId: char('user_id', { length: 5 }), // 可能为空（临时密码开门）
    unlockType: varchar('unlock_type', {
      enum: ['remote', 'temporary_password', 'direct'],
    }).notNull(), // 开锁类型 (远程开锁、临时密码开锁、钥匙开锁，NFC开锁，永久密码开锁，人脸识别开锁，瞳孔识别开锁，指纹开锁，)
    temporaryPasswordId: char('temporary_password_id', { length: 5 }), // 关联临时密码
    timestamp: timestamp('timestamp').defaultNow(),
  },
  // 钥匙，临时密码，永久密码，NCF 人脸，瞳孔，指纹，远程开锁，
  table => [
    index('unlock_device_time_idx').on(table.deviceId, table.timestamp.desc()), // 优化设备解锁历史查询，按时间倒序
    index('unlock_user_time_idx').on(table.userId, table.timestamp.desc()), // 优化用户解锁历史查询，按时间倒序
  ]
);

/** 通知表 */
export const notifications = pgTable(
  'notifications',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    userId: char('user_id', { length: 5 }).notNull(), // 接收用户
    type: varchar('type', {
      enum: [
        'doorbell',
        'temp_password_used',
        'door_open_alert',
        'device_low_battery',
        'door_broken',
        'device_offline',
        'device_online',
        'firmware_update',
      ],
    }).notNull(), // 通知类型(门铃、临时密码使用、忘记关门、设备电量低、门被破坏、设备离线、设备上线、设备固件需要更新)
    message: text('message').notNull(),
    timestamp: timestamp('timestamp').defaultNow(),
    deviceId: char('device_id', { length: 5 }), // 关联设备
    isRead: boolean('is_read').default(false),
  },
  table => [
    index('notifications_user_time_idx').on(table.userId, table.timestamp.desc()), // 优化用户通知列表查询，按时间倒序
    index('notifications_user_unread_idx').on(table.userId, table.isRead), // 优化未读通知查询
  ]
);

// --------------------------
// 关系映射表定义
// --------------------------

/** 设备-设备分组关系映射表 */
export const deviceToDeviceGroup = pgTable(
  'device_to_device_group',
  {
    deviceId: char('device_id', { length: 5 }).notNull(),
    deviceGroupId: char('device_group_id', { length: 5 }).notNull(),
  },
  table => [primaryKey({ columns: [table.deviceId, table.deviceGroupId] })]
);

export const deviceToDeviceGroupRelations = relations(deviceToDeviceGroup, ({ one }) => ({
  device: one(devices, {
    fields: [deviceToDeviceGroup.deviceId],
    references: [devices.id],
  }),
  deviceGroup: one(deviceGroups, {
    fields: [deviceToDeviceGroup.deviceGroupId],
    references: [deviceGroups.id],
  }),
}));

/** 好友-好友分组关系映射表 */
export const friendToFriendGroup = pgTable(
  'friend_to_friend_group',
  {
    friendId: char('friend_id', { length: 5 }).notNull(),
    friendGroupId: char('friend_group_id', { length: 5 }).notNull(),
  },
  table => [primaryKey({ columns: [table.friendId, table.friendGroupId] })]
);

export const friendToFriendGroupRelations = relations(friendToFriendGroup, ({ one }) => ({
  friend: one(friends, {
    fields: [friendToFriendGroup.friendId],
    references: [friends.id],
  }),
  friendGroup: one(friendGroups, {
    fields: [friendToFriendGroup.friendGroupId],
    references: [friendGroups.id],
  }),
}));

/** 好友-临时密码关系映射表 */
export const friendToTemporaryPassword = pgTable(
  'friend_to_temporary_password',
  {
    friendId: char('friend_id', { length: 5 }).notNull(),
    temporaryPasswordId: char('temporary_password_id', { length: 5 }).notNull(),
  },
  table => [primaryKey({ columns: [table.friendId, table.temporaryPasswordId] })]
);

export const friendToTemporaryPasswordRelations = relations(
  friendToTemporaryPassword,
  ({ one }) => ({
    friend: one(friends, {
      fields: [friendToTemporaryPassword.friendId],
      references: [friends.id],
    }),
    temporaryPassword: one(temporaryPasswords, {
      fields: [friendToTemporaryPassword.temporaryPasswordId],
      references: [temporaryPasswords.id],
    }),
  })
);

// --------------------------
// Drizzle 关系定义（类型安全）
// --------------------------

/** 用户关系
 * 一个用户有很多个设备
 * 一个用户有很多个设备分组
 * 一个用户有很多个好友分组
 * 一个用户有很多个通知
 * 一个用户有很多个好友
 */
export const usersRelations = relations(users, ({ many }) => ({
  devices: many(devices),
  deviceGroups: many(deviceGroups),
  friendGroups: many(friendGroups),
  notifications: many(notifications),
  friends: many(friends),
}));

/** 设备关系
 * 一个设备属于一个用户
 * 一个设备可以对应多个分组
 * 一个设备可以对应多个临时密码
 * 一个设备可以对应多个开锁记录
 */
export const devicesRelations = relations(devices, ({ one, many }) => ({
  owner: one(users, {
    fields: [devices.ownerId],
    references: [users.id],
  }),
  groups: many(deviceToDeviceGroup),
  passwords: many(temporaryPasswords),
  unlockRecords: many(unlockRecords),
}));

/** 设备分组关系
 * 一个设备分组属于一个用户
 * 一个设备分组有很多个设备
 */
export const deviceGroupsRelations = relations(deviceGroups, ({ one, many }) => ({
  user: one(users, {
    fields: [deviceGroups.userId],
    references: [users.id],
  }),
  devices: many(deviceToDeviceGroup), // 一个设备分组有多个设备
}));

/** 好友分组关系
 * 一个好友分组属于一个用户
 * 一个好友分组有很多个好友
 */
export const friendGroupsRelations = relations(friendGroups, ({ one, many }) => ({
  user: one(users, {
    fields: [friendGroups.userId],
    references: [users.id],
  }),
  friends: many(friendToFriendGroup),
}));

/** 好友关系
 * 一个好友属于一个用户
 * 一个好友可以属于多个好友分组
 * 一个好友可以拥有多个临时密码
 */
export const friendsRelations = relations(friends, ({ one, many }) => ({
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
  groups: many(friendToFriendGroup), // 一个好友有多个好友分组
  passwords: many(friendToTemporaryPassword), // 一个好友有多个临时密码
}));

/** 临时密码关系
 * 一个临时密码可以被多个好友持有
 * 一个临时密码只能被一个用户创建
 * 一个临时密码可以拥有多个开锁记录
 * 一个临时密码只能对应一个设备
 */
export const temporaryPasswordsRelations = relations(temporaryPasswords, ({ one, many }) => ({
  device: one(devices, {
    fields: [temporaryPasswords.deviceId],
    references: [devices.id],
  }),
  creator: one(users, {
    fields: [temporaryPasswords.creatorId],
    references: [users.id],
  }),
  recipients: many(friendToTemporaryPassword), // 一个临时密码可以被多个好友持有
  unlockRecords: many(unlockRecords), // 一个临时密码可以被多个开锁记录持有
}));

/** 开锁记录关系
 * 一个开锁记录只能对应一个设备
 * 一个开锁记录只能对应一个用户
 * 一个开锁记录只能对应一个临时密码
 * 一个开锁记录只能对应一个好友
 */
export const unlockRecordsRelations = relations(unlockRecords, ({ one }) => ({
  device: one(devices, {
    fields: [unlockRecords.deviceId],
    references: [devices.id],
  }),
  user: one(users, {
    fields: [unlockRecords.userId],
    references: [users.id],
  }),
  temporaryPassword: one(temporaryPasswords, {
    fields: [unlockRecords.temporaryPasswordId],
    references: [temporaryPasswords.id],
  }),
}));

/** 通知关系
 * 一个通知只能对应一个用户
 * 一个通知只能对应一个设备
 * 一个通知可以有很多类型，不只是开锁才会进行通知(例如：门铃、临时密码使用、门开警报，设备电量低等等)
 */
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [notifications.deviceId],
    references: [devices.id],
  }),
}));

// --------------------------
// 表关系示意图（Mermaid 语法）
// --------------------------
/*
```mermaid
erDiagram
  users ||--o{ devices : "拥有"
  users ||--o{ userGroups : "创建"
  users ||--o{ friends : "管理"
  users ||--o{ notifications : "接收"

  devices ||--o{ deviceGroups : "分组"
  devices ||--o{ temporaryPasswords : "生成"
  devices ||--o{ unlockRecords : "记录"

  userGroups ||--o{ friends : "包含"
  temporaryPasswords ||--o{ friends : "分配"

  deviceGroups ||--o{ devices : "包含"
  userGroups ||--o{ friends : "分组"

  deviceGroupRelations }o--|| devices : "设备"
  deviceGroupRelations }o--|| deviceGroups : "分组"

  friendGroupRelations }o--|| friends : "好友"
  friendGroupRelations }o--|| userGroups : "分组"
  */
