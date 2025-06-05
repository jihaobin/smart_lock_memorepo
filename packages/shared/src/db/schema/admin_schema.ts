import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  char,
  uniqueIndex,
  boolean,
  integer,
  json,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

import { createId } from '.';

export const adminUsers = pgTable(
  'admin_users',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    name: varchar('name', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [uniqueIndex('admin_users_email_idx').on(table.name)]
);

// 角色表
export const roles = pgTable(
  'roles',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    name: varchar('name', { length: 50 }).notNull(),
    description: varchar('description'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => [uniqueIndex('roles_name_idx').on(table.name)]
);

// 用户角色关联表
export const userRoles = pgTable(
  'user_roles',
  {
    userId: char('user_id', { length: 5 }).notNull(),
    roleId: char('role_id', { length: 5 }).notNull(),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.userId, table.roleId] }),
      userIdIdx: index('user_roles_user_id_idx').on(table.userId),
      roleIdIdx: index('user_roles_role_id_idx').on(table.roleId),
    };
  }
);

// 路由表
export const routes = pgTable(
  'routes',
  {
    id: char('id', { length: 5 })
      .primaryKey()
      .$default(() => createId())
      .unique(),
    path: varchar('path', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 50 }),
    parentId: char('parent_id', { length: 5 }),
    order: integer('order').default(0),
    isHidden: boolean('hidden').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  table => {
    return {
      pathIdx: uniqueIndex('routes_path_idx').on(table.path),
      parentIdIdx: index('routes_parent_id_idx').on(table.parentId),
    };
  }
);

// 角色路由关联表
export const roleRoutes = pgTable(
  'role_routes',
  {
    roleId: char('role_id', { length: 5 }).notNull(),
    routeId: char('route_id', { length: 5 }).notNull(),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.roleId, table.routeId] }),
      roleIdIdx: index('role_routes_role_id_idx').on(table.roleId),
      routeIdIdx: index('role_routes_route_id_idx').on(table.routeId),
    };
  }
);

// 使用drizzle relations定义关系

// 用户与角色的关系
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  userRoles: many(userRoles, { relationName: 'user_roles' }),
}));

// 角色与用户、路由的关系
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles, { relationName: 'role_users' }),
  roleRoutes: many(roleRoutes, { relationName: 'role_routes' }),
}));

// 用户角色关联表的关系
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(adminUsers, {
    fields: [userRoles.userId],
    references: [adminUsers.id],
    relationName: 'user_roles',
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
    relationName: 'role_users',
  }),
}));

// 路由与角色的关系
export const routesRelations = relations(routes, ({ one, many }) => ({
  parent: one(routes, {
    fields: [routes.parentId],
    references: [routes.id],
    relationName: 'route_parent',
  }),
  children: many(routes, { relationName: 'route_parent' }),
  roleRoutes: many(roleRoutes, { relationName: 'route_roles' }),
}));

// 角色路由关联表的关系
export const roleRoutesRelations = relations(roleRoutes, ({ one }) => ({
  role: one(roles, {
    fields: [roleRoutes.roleId],
    references: [roles.id],
    relationName: 'role_routes',
  }),
  route: one(routes, {
    fields: [roleRoutes.routeId],
    references: [routes.id],
    relationName: 'route_roles',
  }),
}));
