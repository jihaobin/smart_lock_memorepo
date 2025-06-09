import { faker } from '@faker-js/faker';
import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  GetAllAdminUsersType,
  CreateAdminUserType,
  UpdateAdminUserType,
} from '@smart-lock/shared/';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq, and } from 'drizzle-orm';
import { DB } from 'src/database/database.provider';

import { AdminAuthRepository } from '../auth/admin-auth.repository';

@Injectable()
export class AdminUserRepository {
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

  async createUser(createUserData: CreateAdminUserType) {
    if (!createUserData.name || createUserData.name.trim() === '') {
      throw new BadRequestException('用户名不能为空');
    }

    if (!createUserData.password) {
      throw new BadRequestException('密码不能为空');
    }

    try {
      // 检查用户名是否已存在
      const existingUser = await this.db.query.adminUsers.findFirst({
        where: (fields, { eq }) => eq(fields.name, createUserData.name.trim()),
      });

      if (existingUser) {
        throw new BadRequestException('用户名已存在');
      }

      // 如果提供了角色ID，验证角色是否存在
      if (createUserData.roleIds && createUserData.roleIds.length > 0) {
        const existingRoles = await this.db.query.roles.findMany({
          where: (fields, { inArray }) =>
            inArray(fields.id, createUserData.roleIds),
        });

        if (existingRoles.length !== createUserData.roleIds.length) {
          const existingRoleIds = existingRoles.map((role) => role.id);
          const invalidRoleIds = createUserData.roleIds.filter(
            (id) => !existingRoleIds.includes(id),
          );
          throw new BadRequestException(
            `角色ID不存在: ${invalidRoleIds.join(', ')}`,
          );
        }
      }

      // 加密密码
      const passwordHash = await this.adminAuthRepository.hashPassword(
        createUserData.password,
      );

      // 使用事务创建用户和角色关联
      return await this.db.transaction(async (tx) => {
        // 创建用户
        const [newUser] = await tx
          .insert(schema.adminUsers)
          .values({
            name: createUserData.name.trim(),
            passwordHash,
          })
          .returning();

        let userRoles: any[] = [];

        // 如果提供了角色ID，创建角色关联
        if (createUserData.roleIds && createUserData.roleIds.length > 0) {
          const roleAssignments = createUserData.roleIds.map((roleId) => ({
            userId: newUser.id,
            roleId,
          }));

          await tx.insert(schema.userRoles).values(roleAssignments);

          // 在事务内查询角色信息
          userRoles = await tx.query.roles.findMany({
            where: (fields, { inArray }) =>
              inArray(fields.id, createUserData.roleIds),
          });
        }

        // 直接在事务内构建返回数据，避免跨事务查询问题
        return {
          id: newUser.id,
          name: newUser.name,
          createdAt: newUser.createdAt,
          updatedAt: newUser.updatedAt,
          roles: userRoles,
        };
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  async findUserById(id: string) {
    if (!id) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      const user = await this.db.query.adminUsers.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
        with: {
          userRoles: {
            with: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException(`ID为${id}的用户不存在`);
      }

      return {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        roles: user.userRoles.map((userRole) => userRole.role),
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  async updateUser(id: string, updateUserData: UpdateAdminUserType) {
    if (!id) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      // 检查用户是否存在
      const existingUser = await this.db.query.adminUsers.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existingUser) {
        throw new NotFoundException(`ID为${id}的用户不存在`);
      }

      // 如果要更新用户名，检查是否重复
      if (
        updateUserData.name &&
        updateUserData.name.trim() !== existingUser.name
      ) {
        const duplicateUser = await this.db.query.adminUsers.findFirst({
          where: (fields, { eq, ne }) =>
            and(
              eq(fields.name, updateUserData.name!.trim()),
              ne(fields.id, id),
            ),
        });

        if (duplicateUser) {
          throw new BadRequestException('用户名已存在');
        }
      }

      return await this.db.transaction(async (tx) => {
        // 准备更新数据
        const updateData: any = {
          updatedAt: new Date(),
        };

        if (updateUserData.name) {
          updateData.name = updateUserData.name.trim();
        }

        if (updateUserData.password) {
          updateData.passwordHash = await this.adminAuthRepository.hashPassword(
            updateUserData.password,
          );
        }

        // 更新用户基本信息
        await tx
          .update(schema.adminUsers)
          .set(updateData)
          .where(eq(schema.adminUsers.id, id));

        // 如果提供了角色ID，更新角色关联
        if (updateUserData.roleIds !== undefined) {
          // 删除现有角色关联
          await tx
            .delete(schema.userRoles)
            .where(eq(schema.userRoles.userId, id));

          // 添加新的角色关联
          if (updateUserData.roleIds.length > 0) {
            const roleAssignments = updateUserData.roleIds.map((roleId) => ({
              userId: id,
              roleId,
            }));

            await tx.insert(schema.userRoles).values(roleAssignments);
          }
        }

        // 返回更新后的用户数据
        return await this.findUserById(id);
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新用户失败');
    }
  }

  async deleteUser(id: string) {
    if (!id) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      // 检查用户是否存在
      const existingUser = await this.db.query.adminUsers.findFirst({
        where: (fields, { eq }) => eq(fields.id, id),
      });

      if (!existingUser) {
        throw new NotFoundException(`ID为${id}的用户不存在`);
      }

      // 使用事务删除用户和相关数据
      return await this.db.transaction(async (tx) => {
        // 删除用户角色关联
        await tx
          .delete(schema.userRoles)
          .where(eq(schema.userRoles.userId, id));

        // 删除用户
        const [deletedUser] = await tx
          .delete(schema.adminUsers)
          .where(eq(schema.adminUsers.id, id))
          .returning();

        return {
          id: deletedUser.id,
          name: deletedUser.name,
          message: '用户删除成功',
        };
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('删除用户失败');
    }
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
