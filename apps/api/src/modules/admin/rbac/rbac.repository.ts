import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { RoleItem } from '@smart-lock/shared/.';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq, inArray, isNull } from 'drizzle-orm';
import { AppLoggerService } from 'src/common';
import { DB } from 'src/database/database.provider';

@Injectable()
export class RbacRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(RbacRepository.name);
  }

  // 角色管理
  async createRole(data: {
    name: string;
    description?: string;
    isDefault?: boolean;
  }) {
    if (!data.name || data.name.trim() === '') {
      throw new BadRequestException('角色名称不能为空');
    }

    try {
      const result = (await this.db
        .insert(schema.roles)
        .values({
          ...data,
          name: data.name.trim(),
        })
        .returning()) as {
        id: string;
        name: string;
        description?: string;
        isDefault?: boolean;
        createdAt: Date;
        updatedAt: Date;
      }[];
      return result[0];
    } catch (error) {
      this.logger.error(`创建角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('创建角色失败');
    }
  }

  async updateRole(
    id: string,
    data: { name?: string; description?: string; isDefault?: boolean },
  ) {
    if (!id) {
      throw new BadRequestException('角色ID不能为空');
    }

    if (data.name !== undefined && data.name.trim() === '') {
      throw new BadRequestException('角色名称不能为空');
    }

    try {
      // 检查角色是否存在
      const existingRole = await this.getRoleById(id);
      if (!existingRole) {
        throw new NotFoundException(`ID为${id}的角色不存在`);
      }

      const result = await this.db
        .update(schema.roles)
        .set({
          ...data,
          name: data.name?.trim(),
          updatedAt: new Date(),
        })
        .where(eq(schema.roles.id, id))
        .returning();
      return result[0];
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`更新角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('更新角色失败');
    }
  }

  async deleteRole(id: string) {
    if (!id) {
      throw new BadRequestException('角色ID不能为空');
    }

    try {
      // 检查角色是否存在
      const existingRole = await this.getRoleById(id);
      if (!existingRole) {
        throw new NotFoundException(`ID为${id}的角色不存在`);
      }

      // 检查是否为默认角色
      if (existingRole.isDefault) {
        throw new BadRequestException('不能删除默认角色');
      }

      // 使用事务确保数据一致性
      return await this.db.transaction(async (tx) => {
        // 先删除角色关联的路由
        await tx
          .delete(schema.roleRoutes)
          .where(eq(schema.roleRoutes.roleId, id));
        // 再删除角色关联的用户
        await tx
          .delete(schema.userRoles)
          .where(eq(schema.userRoles.roleId, id));
        // 最后删除角色
        const result = await tx
          .delete(schema.roles)
          .where(eq(schema.roles.id, id))
          .returning();
        return result[0];
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`删除角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('删除角色失败');
    }
  }

  async getRoleById(id: string) {
    if (!id) {
      throw new BadRequestException('角色ID不能为空');
    }

    try {
      const result = await this.db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.id, id));
      return result[0];
    } catch (error) {
      this.logger.error(`获取角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取角色失败');
    }
  }

  async getAllRoles(): Promise<RoleItem[]> {
    try {
      return await this.db
        .select()
        .from(schema.roles)
        .orderBy(schema.roles.name);
    } catch (error) {
      this.logger.error(`获取所有角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取所有角色失败');
    }
  }

  /**
   * 根据角色名称获取角色
   * @param name 角色名称
   * @returns 角色信息
   */
  async getRoleByName(name: string) {
    if (!name) {
      throw new BadRequestException('角色名称不能为空');
    }

    try {
      const result = await this.db
        .select()
        .from(schema.roles)
        .where(eq(schema.roles.name, name));
      return result[0];
    } catch (error) {
      this.logger.error(`通过名称获取角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('通过名称获取角色失败');
    }
  }

  /**
   * 获取指定角色ID的所有用户
   * @param roleId 角色ID
   * @returns 用户列表
   */
  async getUsersByRoleId(roleId: string) {
    if (!roleId) {
      throw new BadRequestException('角色ID不能为空');
    }

    try {
      // 查询具有指定角色的所有用户ID
      const userRoles = await this.db
        .select({
          userId: schema.userRoles.userId,
        })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.roleId, roleId));

      if (!userRoles || userRoles.length === 0) {
        return [];
      }

      // 获取用户ID列表
      const userIds = userRoles.map((ur) => ur.userId);

      // 查询这些用户的详细信息
      const users = await this.db
        .select()
        .from(schema.adminUsers)
        .where(inArray(schema.adminUsers.id, userIds));

      return users;
    } catch (error) {
      this.logger.error(`获取角色用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取角色用户失败');
    }
  }

  // 路由管理
  async createRoute(data: {
    path: string;
    name: string;
    icon?: string;
    parentId?: string;
    order?: number;
    role: string[];
    isHidden?: boolean;
  }) {
    if (!data.path || data.path.trim() === '') {
      throw new BadRequestException('路由路径不能为空');
    }

    if (!data.name || data.name.trim() === '') {
      throw new BadRequestException('路由名称不能为空');
    }

    if (!Array.isArray(data.role)) {
      throw new BadRequestException('角色ID列表必须是数组');
    }

    // 如果指定了父路由，检查父路由是否存在
    if (data.parentId) {
      const parentRoute = await this.getRouteById(data.parentId);
      if (!parentRoute) {
        throw new NotFoundException(`ID为${data.parentId}的父路由不存在`);
      }
    }

    try {
      // 检查所有角色是否存在
      if (data.role.length > 0) {
        const roles = await this.db
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(inArray(schema.roles.id, data.role));

        const existingRoleIds = roles.map((role) => role.id);
        const nonExistingRoleIds = data.role.filter(
          (id) => !existingRoleIds.includes(id),
        );

        if (nonExistingRoleIds.length > 0) {
          throw new NotFoundException(
            `ID为${nonExistingRoleIds.join(', ')}的角色不存在`,
          );
        }
      }

      // 使用事务确保数据一致性
      return await this.db.transaction(async (tx) => {
        // 创建路由
        const routeResult = await tx
          .insert(schema.routes)
          .values({
            ...data,
            path: data.path.trim(),
            name: data.name.trim(),
          })
          .returning();

        const newRoute = routeResult[0];

        // 如果有角色，创建路由与角色的关联
        if (data.role.length > 0) {
          const roleRouteValues = data.role.map((roleId) => ({
            roleId,
            routeId: newRoute.id,
          }));

          await tx.insert(schema.roleRoutes).values(roleRouteValues);
        }

        return newRoute;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`创建路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('创建路由失败');
    }
  }

  async updateRoute(
    id: string,
    data: {
      path?: string;
      name?: string;
      component?: string;
      icon?: string;
      parentId?: string;
      order?: number;
      isMenu?: boolean;
      meta?: {
        title?: string;
        description?: string;
        hidden?: boolean;
      };
    },
  ) {
    if (!id) {
      throw new BadRequestException('路由ID不能为空');
    }

    if (data.path !== undefined && data.path.trim() === '') {
      throw new BadRequestException('路由路径不能为空');
    }

    if (data.name !== undefined && data.name.trim() === '') {
      throw new BadRequestException('路由名称不能为空');
    }

    if (data.component !== undefined && data.component.trim() === '') {
      throw new BadRequestException('路由组件不能为空');
    }

    try {
      // 检查路由是否存在
      const existingRoute = await this.getRouteById(id);
      if (!existingRoute) {
        throw new NotFoundException(`ID为${id}的路由不存在`);
      }

      // 检查父路由是否存在
      if (data.parentId) {
        // 检查是否形成循环依赖（避免将自身或自身的子路由设为父路由）
        if (data.parentId === id) {
          throw new BadRequestException('不能将路由自身设为父路由');
        }

        const parentRoute = await this.getRouteById(data.parentId);
        if (!parentRoute) {
          throw new NotFoundException(`ID为${data.parentId}的父路由不存在`);
        }
      }

      const result = await this.db
        .update(schema.routes)
        .set({
          ...data,
          path: data.path?.trim(),
          name: data.name?.trim(),
          updatedAt: new Date(),
        })
        .where(eq(schema.routes.id, id))
        .returning();
      return result[0];
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`更新路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('更新路由失败');
    }
  }

  async deleteRoute(id: string) {
    if (!id) {
      throw new BadRequestException('路由ID不能为空');
    }

    try {
      // 检查路由是否存在
      const existingRoute = await this.getRouteById(id);
      if (!existingRoute) {
        throw new NotFoundException(`ID为${id}的路由不存在`);
      }

      // 使用事务确保数据一致性
      return await this.db.transaction(async (tx) => {
        // 先删除与此路由关联的角色路由关系
        await tx
          .delete(schema.roleRoutes)
          .where(eq(schema.roleRoutes.routeId, id));
        // 更新子路由的parentId为null
        await tx
          .update(schema.routes)
          .set({ parentId: null, updatedAt: new Date() })
          .where(eq(schema.routes.parentId, id));
        // 删除路由
        const result = await tx
          .delete(schema.routes)
          .where(eq(schema.routes.id, id))
          .returning();
        return result[0];
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`删除路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('删除路由失败');
    }
  }

  async getRouteById(id: string) {
    if (!id) {
      throw new BadRequestException('路由ID不能为空');
    }

    try {
      const result = await this.db
        .select()
        .from(schema.routes)
        .where(eq(schema.routes.id, id));
      return result[0];
    } catch (error) {
      this.logger.error(`获取路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取路由失败');
    }
  }

  async getAllRoutes() {
    try {
      const routes = await this.db.query.routes.findMany({
        with: {
          children: {
            with: {
              children: true, // 第三层子路由
              roleRoutes: {
                with: {
                  role: true,
                },
              },
            },
            orderBy: (router, { asc }) => [asc(router.order)],
          },
          roleRoutes: {
            with: {
              role: true,
            },
          },
        },
        where: isNull(schema.routes.parentId), // 只查询顶级路由
        orderBy: (router, { asc }) => [asc(router.order)],
      });

      // 转换数据格式
      const transformRouteData = (route: any): any => {
        const transformed = { ...route };

        // 转换roleRoutes为role字段
        if (route.roleRoutes && route.roleRoutes.length > 0) {
          transformed.role = route.roleRoutes.map((rr: any) => rr.role.name);
          delete transformed.roleRoutes;
        }

        // 递归处理children
        if (route.children && route.children.length > 0) {
          transformed.children = route.children.map(transformRouteData);
        }

        return transformed;
      };

      return routes.map(transformRouteData);

      // return {
      //   items: routes.map(transformRouteData),
      //   total: routes.length,
      //   page: page,
      //   pageSize: pageSize,
      // }
    } catch (error) {
      this.logger.error(`获取所有路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取所有路由失败');
    }
  }

  async getAllRoutesOnPage(query: { page?: string; pageSize?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.pageSize) || 10);
    const offset = (page - 1) * pageSize;
    try {
      const routes = await this.db.query.routes.findMany({
        with: {
          children: {
            with: {
              children: true, // 第三层子路由
              roleRoutes: {
                with: {
                  role: true,
                },
              },
            },
            orderBy: (router, { asc }) => [asc(router.order)],
          },
          roleRoutes: {
            with: {
              role: true,
            },
          },
        },
        where: isNull(schema.routes.parentId), // 只查询顶级路由
        orderBy: (router, { asc }) => [asc(router.order)],
        offset,
        limit: pageSize,
      });

      // 转换数据格式
      const transformRouteData = (route: any): any => {
        const transformed = { ...route };

        // 转换roleRoutes为role字段
        if (route.roleRoutes && route.roleRoutes.length > 0) {
          transformed.role = route.roleRoutes.map((rr: any) => rr.role.name);
          delete transformed.roleRoutes;
        }

        // 递归处理children
        if (route.children && route.children.length > 0) {
          transformed.children = route.children.map(transformRouteData);
        }

        return transformed;
      };

      return {
        items: routes.map(transformRouteData),
        total: routes.length,
        page: page,
        pageSize: pageSize,
      };
    } catch (error) {
      this.logger.error(`获取所有路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取所有路由失败');
    }
  }

  // 角色路由关联
  async assignRoutesToRole(roleId: string, routeIds: string[]) {
    if (!roleId) {
      throw new BadRequestException('角色ID不能为空');
    }

    if (!Array.isArray(routeIds)) {
      throw new BadRequestException('路由ID列表必须是数组');
    }

    try {
      // 检查角色是否存在
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new NotFoundException(`ID为${roleId}的角色不存在`);
      }

      // 检查所有路由是否存在
      if (routeIds.length > 0) {
        const routes = await this.db
          .select({ id: schema.routes.id })
          .from(schema.routes)
          .where(inArray(schema.routes.id, routeIds));

        const existingRouteIds = routes.map((route) => route.id);
        const nonExistingRouteIds = routeIds.filter(
          (id) => !existingRouteIds.includes(id),
        );

        if (nonExistingRouteIds.length > 0) {
          throw new NotFoundException(
            `ID为${nonExistingRouteIds.join(', ')}的路由不存在`,
          );
        }
      }

      // 使用事务确保数据一致性
      return await this.db.transaction(async (tx) => {
        // 先删除该角色的所有路由关联
        await tx
          .delete(schema.roleRoutes)
          .where(eq(schema.roleRoutes.roleId, roleId));

        // 如果没有新的路由，直接返回
        if (!routeIds.length) return [];

        // 添加新的关联
        const values = routeIds.map((routeId) => ({
          roleId,
          routeId,
        }));

        const result = await tx
          .insert(schema.roleRoutes)
          .values(values)
          .returning();
        return result;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`分配路由到角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('分配路由到角色失败');
    }
  }

  async getRoleRoutes(roleId: string) {
    if (!roleId) {
      throw new BadRequestException('角色ID不能为空');
    }

    try {
      // 检查角色是否存在
      const existingRole = await this.getRoleById(roleId);
      if (!existingRole) {
        throw new NotFoundException(`ID为${roleId}的角色不存在`);
      }

      const result = await this.db
        .select({
          route: schema.routes,
        })
        .from(schema.roleRoutes)
        .innerJoin(
          schema.routes,
          eq(schema.roleRoutes.routeId, schema.routes.id),
        )
        .where(eq(schema.roleRoutes.roleId, roleId));

      return result.map((item) => item.route);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`获取角色路由失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取角色路由失败');
    }
  }

  // 用户角色关联
  async assignRolesToUser(userId: string, roleIds: string[]) {
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    if (!Array.isArray(roleIds)) {
      throw new BadRequestException('角色ID列表必须是数组');
    }

    try {
      // 检查所有角色是否存在
      if (roleIds.length > 0) {
        const roles = await this.db
          .select({ id: schema.roles.id })
          .from(schema.roles)
          .where(inArray(schema.roles.id, roleIds));

        const existingRoleIds = roles.map((role) => role.id);
        const nonExistingRoleIds = roleIds.filter(
          (id) => !existingRoleIds.includes(id),
        );

        if (nonExistingRoleIds.length > 0) {
          throw new NotFoundException(
            `ID为${nonExistingRoleIds.join(', ')}的角色不存在`,
          );
        }
      }

      // 使用事务确保数据一致性
      return await this.db.transaction(async (tx) => {
        // 先删除该用户的所有角色关联
        await tx
          .delete(schema.userRoles)
          .where(eq(schema.userRoles.userId, userId));

        // 如果没有新的角色，直接返回
        if (!roleIds.length) return [];

        // 添加新的关联
        const values = roleIds.map((roleId) => ({
          userId,
          roleId,
        }));

        const result = await tx
          .insert(schema.userRoles)
          .values(values)
          .returning();
        return result;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(`分配角色到用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('分配角色到用户失败');
    }
  }

  async getUserRoles(userId: string) {
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      const result = await this.db
        .select({
          role: schema.roles,
        })
        .from(schema.userRoles)
        .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
        .where(eq(schema.userRoles.userId, userId));

      return result.map((item) => item.role);
    } catch (error) {
      this.logger.error(`获取用户角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取用户角色失败');
    }
  }

  // 获取用户可访问的路由
  async getUserAccessibleRoutes(userId: string) {
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      // 获取用户的所有角色ID
      const userRolesResult = await this.db
        .select({
          roleId: schema.userRoles.roleId,
        })
        .from(schema.userRoles)
        .where(eq(schema.userRoles.userId, userId));

      const roleIds = userRolesResult.map((item) => item.roleId);

      // 如果用户没有角色，返回空数组
      if (!roleIds.length) return [];

      // 获取这些角色可访问的所有路由
      const routesResult = await this.db
        .select({
          route: schema.routes,
        })
        .from(schema.roleRoutes)
        .innerJoin(
          schema.routes,
          eq(schema.roleRoutes.routeId, schema.routes.id),
        )
        .where(inArray(schema.roleRoutes.roleId, roleIds));

      // 去重
      const uniqueRoutes = Array.from(
        new Map(
          routesResult.map((item) => [item.route.id, item.route]),
        ).values(),
      );

      return uniqueRoutes;
    } catch (error) {
      this.logger.error(
        `获取用户可访问路由失败: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('获取用户可访问路由失败');
    }
  }

  /**
   * 根据ID获取用户
   * @param userId 用户ID
   * @returns 用户信息或null
   */
  async getUserById(userId: string) {
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    try {
      const result = await this.db
        .select()
        .from(schema.adminUsers)
        .where(eq(schema.adminUsers.id, userId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.logger.error(`根据ID查询用户失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('查询用户失败');
    }
  }

  /**
   * 获取指定路由关联的所有角色
   * @param routeId 路由ID
   * @returns 角色列表
   */
  async getRouteRoles(routeId: string) {
    if (!routeId) {
      throw new BadRequestException('路由ID不能为空');
    }

    try {
      const result = await this.db
        .select({
          id: schema.roles.id,
          name: schema.roles.name,
          description: schema.roles.description,
        })
        .from(schema.roleRoutes)
        .innerJoin(schema.roles, eq(schema.roleRoutes.roleId, schema.roles.id))
        .where(eq(schema.roleRoutes.routeId, routeId));

      return result;
    } catch (error) {
      this.logger.error(`获取路由关联角色失败: ${error.message}`, error.stack);
      throw new InternalServerErrorException('获取路由关联角色失败');
    }
  }
}
