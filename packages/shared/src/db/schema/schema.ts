// schema.ts
import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  char,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

import { createId } from '.';

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
    phone: varchar('phone', { length: 11 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique(),
    nikeName: varchar('nike_name', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    uniqueIndex('users_phone_idx').on(table.phone),
    uniqueIndex('users_email_idx').on(table.email),
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
    ownerId: char('owner_id', { length: 5 }), // 关联用户
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 设备类型（如门锁型号）
    status: jsonb('status')
      .$type<{
        // 设备电量
        batteryLevel: number;
        // 设备固件版本
        firmwareVersion: number;
        // 是否在线
        isOnline: boolean;
        // 门是否开启
        isOpen: boolean;
      }>()
      .notNull(), // 设备状态
    hasCamera: boolean('has_camera').default(false),
    deviceGroupId: char('device_group_id', { length: 5 }), // 新增字段：所属分组，可为 null
    nikeName: varchar('nike_name', { length: 255 }), // 新增字段：设备昵称
  },
  table => [
    index('devices_owner_type_idx').on(table.ownerId, table.type), // 复合索引优化按所有者查询设备列表
    index('devices_status_idx').on(table.status),
    index('devices_group_idx').on(table.deviceGroupId), // 新增索引，优化分组查询
  ]
);

/**设备类型表 */
export const deviceTypes = pgTable(
  'device_types',
  {
    id: char('id', { length: 5 }).primaryKey().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    hasCamera: boolean('has_camera').default(false),
    hasFingerprint: boolean('has_fingerprint').default(false),
    hasFace: boolean('has_face').default(false),
    hasEye: boolean('has_eye').default(false),
    hasNFC: boolean('has_nfc').default(false),
    hasWifi: boolean('has_wifi').default(false),
    hasBluetooth: boolean('has_bluetooth').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [index('device_types_name_idx').on(table.name)]
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
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
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
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [uniqueIndex('friend_groups_user_name_idx').on(table.userId, table.groupName)]
);

/** 好友表 */
export const friends = pgTable(
  'friends',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    userId: char('user_id', { length: 5 }).notNull(), // 所属用户
    remarkName: varchar('remark_name', { length: 255 }).notNull(),
    linkedPasswords: varchar('linked_passwords', { length: 6 }), // 关联的密码
    friendGroupId: char('friend_group_id', { length: 5 }).notNull(), // 新增分组外键字段
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [
    index('friends_user_idx').on(table.userId),
    index('friends_remark_name_idx').on(table.remarkName),
    index('friends_group_idx').on(table.friendGroupId), // 新增分组索引
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
      enum: [
        'remote',
        'temporary_password',
        'direct',
        'nfc',
        'permanent_password',
        'face',
        'eye',
        'fingerprint',
      ],
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
        'doorbell', // 门铃
        'device_open_alert', // 长时间没有关门
        'device_low_battery', // 电量低
        'device_broken', // 门被破坏
        'device_open', // 开门
        'device_close', // 关门
        'device_offline', // 设备离线
        'device_online', // 设备上线
        'firmware_update', // 固件更新
      ],
    }).notNull(),
    data: jsonb('data').$type<{
      temp_password?: string; // 临时密码
      device_battery?: number; // 设备电量
      device_firmware_version?: string; // 设备固件版本
      openType?:
        | 'remote'
        | 'temporary_password'
        | 'direct'
        | 'nfc'
        | 'permanent_password'
        | 'face'
        | 'eye'
        | 'fingerprint'; // 开门方式
      openFriend?: string; // 开门好友
      noOpenTime?: number; // 未开门时长
    }>(),
    message: text('message').notNull(),
    timestamp: timestamp('timestamp').defaultNow(),
    deviceId: char('device_id', { length: 5 }), // 关联设备
    importanceLevel: varchar('importance_level', {
      enum: ['low', 'medium', 'high', 'critical'], // 低，中，高，紧急
    })
      .default('medium')
      .notNull(), // 重要程度
    notificationMethod: varchar('notification_method', {
      enum: ['app', 'sms', 'call'],
    })
      .default('app')
      .notNull(), // 通知方式
    deliveryStatus: varchar('delivery_status', {
      enum: ['pending', 'sent', 'delivered', 'failed'],
    }).default('pending'), // 传递状态
  },
  table => [
    index('notifications_user_time_idx').on(table.userId, table.timestamp.desc()), // 优化用户通知列表查询，按时间倒序
    index('notifications_importance_idx').on(table.importanceLevel), // 优化按重要性查询
    index('notifications_status_idx').on(table.deliveryStatus), // 优化按状态查询
  ]
);

/** 通知发送记录表 */
export const notificationDeliveryLogs = pgTable(
  'notification_delivery_logs',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    notificationId: char('notification_id', { length: 5 }).notNull(), // 关联到通知记录
    deliveryMethod: varchar('delivery_method', {
      enum: ['sms', 'call', 'app'],
    }).notNull(), // 发送方式
    targetNumber: varchar('target_number', { length: 20 }).notNull(), // 目标号码
    status: varchar('status', {
      enum: ['pending', 'sent', 'delivered', 'failed'],
    }).default('pending'), // 发送状态
    errorMessage: text('error_message'), // 错误消息
    attemptTime: timestamp('attempt_time').defaultNow(), // 尝试时间
    completionTime: timestamp('completion_time'), // 完成时间
    retryCount: integer('retry_count').default(0), // 重试次数
    aliYunMsgId: varchar('aliyun_msg_id', { length: 64 }), // 阿里云返回的消息ID
    maxDeliveryTime: timestamp('max_delivery_time'), // 最大等待送达时间
  },
  table => [
    index('delivery_logs_notification_idx').on(table.notificationId),
    index('delivery_logs_status_idx').on(table.status),
    index('delivery_logs_method_idx').on(table.deliveryMethod),
    index('delivery_logs_aliyun_id_idx').on(table.aliYunMsgId),
  ]
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
  deviceGroup: one(deviceGroups, {
    fields: [devices.deviceGroupId],
    references: [deviceGroups.id],
  }),
  passwords: many(temporaryPasswords),
  unlockRecords: many(unlockRecords),
  deviceType: one(deviceTypes, {
    fields: [devices.type],
    references: [deviceTypes.id],
  }),
}));

/** 设备类型关系
 * 一个设备类型可以有多个设备
 */
export const deviceTypesRelations = relations(deviceTypes, ({ many }) => ({
  devices: many(devices),
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
  devices: many(devices), // 一个设备分组有多个设备
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
  friends: many(friends), // 直接关联好友表
}));

/** 好友关系
 * 一个好友属于一个用户
 * 一个好友可以属于多个好友分组
 * 一个好友可以拥有多个临时密码
 */
export const friendsRelations = relations(friends, ({ one }) => ({
  // 修改为单关系
  user: one(users, {
    fields: [friends.userId],
    references: [users.id],
  }),
  friendGroup: one(friendGroups, {
    // 新增分组关系
    fields: [friends.friendGroupId],
    references: [friendGroups.id],
  }),
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
 * 一个通知可以有多条发送记录（例如重试情况）
 */
export const notificationsRelations = relations(notifications, ({ one, many }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  device: one(devices, {
    fields: [notifications.deviceId],
    references: [devices.id],
  }),
  deliveryLogs: many(notificationDeliveryLogs),
}));

/** 通知发送记录关系
 * 一条发送记录对应一条通知
 */
export const notificationDeliveryLogsRelations = relations(notificationDeliveryLogs, ({ one }) => ({
  notification: one(notifications, {
    fields: [notificationDeliveryLogs.notificationId],
    references: [notifications.id],
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

  notifications ||--o{ notificationDeliveryLogs : "产生"

  deviceGroupRelations }o--|| devices : "设备"
  deviceGroupRelations }o--|| deviceGroups : "分组"

  friendGroupRelations }o--|| friends : "好友"
  friendGroupRelations }o--|| userGroups : "分组"
  */
