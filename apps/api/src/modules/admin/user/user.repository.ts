import { faker } from '@faker-js/faker';
import { Injectable, Inject } from '@nestjs/common';
import { GetAllAdminUsersType } from '@smart-lock/shared/';
import { DbType, schema } from '@smart-lock/shared/server';
import { DB } from 'src/database/database.provider';

import { AdminAuthRepository } from '../auth/admin-auth.repository';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly adminAuthRepository: AdminAuthRepository,
  ) {}

  async getAllUsers(query: GetAllAdminUsersType) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const offset = (page - 1) * pageSize;
    const users = await this.db.query.adminUsers.findMany({
      offset,
      limit: pageSize,
      with: {
        userRoles: {
          with: {
            role: true,
          },
        },
      },
    });
    const result = users.map((user) => ({
      id: user.id,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((role) => role.role),
    }));

    const total = await this.db.$count(schema.adminUsers);

    return {
      items: result,
      total: total,
      page: page,
      pageSize: pageSize,
    };
  }

  async createTestUserData(total = 50) {
    const adminRoleQuery = this.db.query.roles.findFirst({
      where: (fields, { eq }) => eq(fields.name, 'admin'),
    });
    const userRoleQuery = this.db.query.roles.findFirst({
      where: (fields, { eq }) => eq(fields.name, 'user'),
    });

    const [adminRoleResult, userRoleResult] = await Promise.allSettled([
      adminRoleQuery,
      userRoleQuery,
    ]);

    const adminRole =
      adminRoleResult.status === 'fulfilled' ? adminRoleResult.value : null;
    const userRole =
      userRoleResult.status === 'fulfilled' ? userRoleResult.value : null;

    if (!adminRole || !userRole) {
      console.error('Failed to retrieve roles');
      return;
    }

    const roles = [adminRole, userRole];

    // mock用户数据
    const usersToCreate: { name: string; passwordHash: string }[] = [];
    for (let i = 0; i < total; i++) {
      const name = faker.internet.username();
      const password = faker.internet.password({
        length: 10,
        memorable: false,
        pattern: /[A-Za-z0-9]/,
        prefix: 'Test',
      }); // Ensure password meets complexity
      const passwordHash = await this.adminAuthRepository.hashPassword(
        password + 'A1',
      ); // Append to meet complexity if needed
      usersToCreate.push({ name, passwordHash });
    }

    // 使用事务插入数据库，并关联到角色(角色随机为adminRole和userRole)
    await this.db.transaction(async (tx) => {
      for (const userData of usersToCreate) {
        const [newUser] = await tx
          .insert(schema.adminUsers)
          .values(userData)
          .returning();
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        await tx.insert(schema.userRoles).values({
          userId: newUser.id,
          roleId: randomRole.id,
        });
      }
    });
  }
}
