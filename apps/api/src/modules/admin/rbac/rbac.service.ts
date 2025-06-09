import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import {
  RouteItem,
  CreateRouteDto,
  UpdateRouteDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '@smart-lock/shared';
import {
  CACHE_SERVICE,
  ICacheService,
  IAdvancedCacheService,
} from 'src/common/cache';
import { APP_CONFIG, AppConfig } from 'src/config/config.provider';

import { RbacRepository } from './rbac.repository';
import { AdminAuthRepository } from '../auth/admin-auth.repository';

@Injectable()
export class RbacService implements OnModuleInit {
  // 默认缓存过期时间: 5分钟 (转换为秒)
  private readonly DEFAULT_CACHE_TTL = 5 * 60;

  constructor(
    private readonly rbacRepository: RbacRepository,
    private readonly adminAuthRepository: AdminAuthRepository,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(CACHE_SERVICE) private readonly cacheService: ICacheService,
  ) {}

  /**
   * 模块初始化时执行，确保系统中至少有一个默认角色和超级管理员用户
   */
  async onModuleInit() {
    await this.ensureDefaultRolesExist();
    await this.ensureSuperAdminUserExists();
    await this.ensureDefaultRoutesExist();
  }

  /**
   * 从缓存获取数据，如果缓存不存在或已过期，则执行fetchFn获取数据并缓存
   * @param key 缓存键
   * @param fetchFn 获取数据的函数
   * @param ttl 缓存有效期（秒）
   * @returns 缓存的数据或新获取的数据
   */
  private async getFromCacheOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = this.DEFAULT_CACHE_TTL,
  ): Promise<T> {
    // 尝试从Redis缓存获取数据
    const cached = await this.cacheService.get<T>(key);

    // 如果缓存存在，直接返回
    if (cached !== undefined) {
      return cached;
    }

    // 否则重新获取数据
    const data = await fetchFn();

    // 更新Redis缓存
    await this.cacheService.set(key, data, ttl);

    return data;
  }

  /**
   * 清除指定键的缓存
   * @param key 缓存键
   */
  private async clearCache(key: string) {
    await this.cacheService.del(key);
  }

  /**
   * 清除所有角色相关的缓存
   */
  private async clearRolesCache() {
    await this.clearCache('allRoles');
    // 注意：Redis缓存无法直接遍历所有键，这里采用约定的键名模式
    // 在实际使用中，可以考虑使用Redis的SCAN命令或维护一个键列表
    // 暂时清除常用的角色缓存键
    const commonRoleKeys = ['allRoles'];
    for (const key of commonRoleKeys) {
      await this.clearCache(key);
    }
  }

  /**
   * 清除所有路由相关的缓存
   */
  private async clearRoutesCache() {
    await this.clearCache('allRoutes');
    await this.clearCache('allRoutesOnPage');

    // 清除所有用户的路由缓存
    // 由于路由信息发生变化，所有用户的可访问路由都可能受到影响
    await this.clearAllUserRoutesCache();

    // 注意：Redis缓存无法直接遍历所有键，这里采用约定的键名模式
    // 在实际使用中，可以考虑使用Redis的SCAN命令或维护一个键列表
    // 暂时清除常用的路由缓存键
    const commonRouteKeys = ['allRoutes', 'allRoutesOnPage'];
    for (const key of commonRouteKeys) {
      await this.clearCache(key);
    }
  }

  /**
   * 清除所有用户的路由缓存
   * 当路由信息发生变化时，需要清除所有用户的路由缓存
   */
  private async clearAllUserRoutesCache() {
    try {
      // 检查是否是高级缓存服务（Redis）
      if (this.isAdvancedCacheService(this.cacheService)) {
        // 使用Redis的keys命令查找所有userRoutes_*键
        const redis = this.cacheService.getClient<any>();
        const pattern = 'userRoutes_*';
        const keys = await redis.keys(pattern);

        if (keys && keys.length > 0) {
          // 批量删除所有用户路由缓存
          await Promise.all(keys.map((key: string) => this.clearCache(key)));
          console.log(`已清除 ${keys.length} 个用户路由缓存`);
        } else {
          console.log('没有找到需要清除的用户路由缓存');
        }
      } else {
        // 如果是内存缓存，由于无法遍历所有键，这里可以考虑其他方案
        // 比如设置较短的缓存过期时间，或者维护一个用户ID列表
        console.log('当前使用内存缓存，无法批量清除用户路由缓存');
      }
    } catch (error) {
      console.error('清除用户路由缓存时出错:', error);
      // 如果出错，可以考虑其他方案
      // 比如维护一个用户ID列表，或者使用固定的缓存失效时间
    }
  }

  /**
   * 检查缓存服务是否是高级缓存服务
   */
  private isAdvancedCacheService(
    cacheService: ICacheService,
  ): cacheService is IAdvancedCacheService {
    return (
      cacheService && typeof (cacheService as any).getClient === 'function'
    );
  }

  /**
   * 确保超级管理员用户存在
   */
  private async ensureSuperAdminUserExists() {
    try {
      // 1. 获取所有用户
      const superAdminRole =
        await this.rbacRepository.getRoleByName('superadmin');
      if (!superAdminRole) {
        throw new Error(
          '无法找到superadmin角色，请确保先调用ensureDefaultRolesExist方法',
        );
      }

      // 2. 查找是否有超级管理员角色的用户
      const userWithSuperAdminRole = await this.rbacRepository.getUsersByRoleId(
        superAdminRole.id,
      );

      // 3. 如果已经存在超级管理员用户，则无需创建
      if (userWithSuperAdminRole && userWithSuperAdminRole.length > 0) {
        return;
      }

      // 4. 不存在超级管理员用户，创建一个
      const superAdminUsername = this.config.SUPER_ADMIN_USERNAME;
      const superAdminPassword = this.config.SUPER_ADMIN_PASSWORD;

      // 检查配置是否存在
      if (!superAdminUsername || !superAdminPassword) {
        throw new Error(
          '缺少超级管理员配置，请检查环境变量: SUPER_ADMIN_USERNAME 和 SUPER_ADMIN_PASSWORD',
        );
      }

      // 检查用户名是否已存在
      const existingUser =
        await this.adminAuthRepository.findUserByName(superAdminUsername);

      let userId: string;

      if (existingUser) {
        // 如果用户存在但没有超级管理员角色，则赋予该角色
        userId = existingUser.id;
      } else {
        // 创建用户
        const passwordHash =
          await this.adminAuthRepository.hashPassword(superAdminPassword);
        const newUser = await this.adminAuthRepository.createUser({
          name: superAdminUsername,
          passwordHash,
        });
        userId = newUser.id;
      }

      // 为用户分配超级管理员角色
      await this.assignRolesToUser(userId, [superAdminRole.id]);

      console.log(`成功创建超级管理员用户: ${superAdminUsername}`);
    } catch (error) {
      console.error('创建超级管理员用户失败:', error.message);
      throw new InternalServerErrorException(
        `初始化超级管理员失败: ${error.message}`,
      );
    }
  }

  /**
   * 确保默认角色存在
   */
  async ensureDefaultRolesExist() {
    const roles = await this.getAllRoles();

    // 检查是否存在默认角色
    const defaultRole = roles.find((role) => role.isDefault);

    // 如果没有默认角色，创建一个
    if (!defaultRole) {
      await this.rbacRepository.createRole({
        name: 'user',
        description: '普通用户，拥有基本访问权限',
        isDefault: true,
      });
      await this.clearRolesCache(); // 清除缓存
    }

    // 确保系统中有管理员角色
    const adminRole = roles.find((role) => role.name === 'admin');
    if (!adminRole) {
      await this.rbacRepository.createRole({
        name: 'admin',
        description: '管理员，拥有管理系统的权限',
        isDefault: false,
      });
      await this.clearRolesCache(); // 清除缓存
    }

    // 确保系统中有超级管理员角色
    const superAdminRole = roles.find((role) => role.name === 'superadmin');
    if (!superAdminRole) {
      await this.rbacRepository.createRole({
        name: 'superadmin',
        description: '超级管理员，拥有系统最高权限',
        isDefault: false,
      });
      await this.clearRolesCache(); // 清除缓存
    }
  }

  // 角色管理
  async createRole(data: CreateRoleDto) {
    const result = await this.rbacRepository.createRole(data);
    await this.clearRolesCache(); // 清除缓存
    return result;
  }

  async updateRole(id: string, data: UpdateRoleDto) {
    const role = await this.getRoleById(id);
    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }
    const result = await this.rbacRepository.updateRole(id, data);
    await this.clearRolesCache(); // 清除缓存
    return result;
  }

  async deleteRole(id: string) {
    const role = await this.getRoleById(id);
    if (!role) {
      throw new NotFoundException(`角色ID ${id} 不存在`);
    }

    // 防止删除默认角色
    if (role.isDefault) {
      throw new BadRequestException('不能删除默认角色');
    }

    // 检查是否是预定义的管理员角色
    if (role.name === 'admin' || role.name === 'superadmin') {
      throw new BadRequestException('不能删除系统预设的管理员角色');
    }

    const result = await this.rbacRepository.deleteRole(id);
    await this.clearRolesCache(); // 清除缓存
    return result;
  }

  async getRoleById(id: string) {
    return this.getFromCacheOrFetch(`role_${id}`, async () => {
      const role = await this.rbacRepository.getRoleById(id);
      if (!role) {
        throw new NotFoundException(`角色ID ${id} 不存在`);
      }
      return role;
    });
  }

  async getAllRoles() {
    return this.getFromCacheOrFetch('allRoles', () =>
      this.rbacRepository.getAllRoles(),
    );
  }

  // 路由管理
  async createRoute(data: CreateRouteDto) {
    const result = await this.rbacRepository.createRoute(data);
    await this.clearRoutesCache(); // 清除缓存
    return result;
  }

  async updateRoute(id: string, data: UpdateRouteDto) {
    const route = await this.getRouteById(id);
    if (!route) {
      throw new NotFoundException(`路由ID ${id} 不存在`);
    }

    // 如果有父路由ID，确保父路由存在且不是自己
    if (data.parentId) {
      if (data.parentId === id) {
        throw new ConflictException('路由不能将自己设为父路由');
      }

      const parentRoute = await this.getRouteById(data.parentId);
      if (!parentRoute) {
        throw new NotFoundException(`父路由ID ${data.parentId} 不存在`);
      }
    }

    const result = await this.rbacRepository.updateRoute(id, data);
    await this.clearRoutesCache(); // 清除缓存
    return result;
  }

  async deleteRoute(id: string) {
    const route = await this.getRouteById(id);
    if (!route) {
      throw new NotFoundException(`路由ID ${id} 不存在`);
    }
    const result = await this.rbacRepository.deleteRoute(id);
    await this.clearRoutesCache(); // 清除缓存
    return result;
  }

  async getRouteById(id: string) {
    return this.getFromCacheOrFetch(`route_${id}`, async () => {
      const route = await this.rbacRepository.getRouteById(id);
      if (!route) {
        throw new NotFoundException(`路由ID ${id} 不存在`);
      }
      return route;
    });
  }

  async getAllRoutes() {
    return this.getFromCacheOrFetch('allRoutes', () =>
      this.rbacRepository.getAllRoutes(),
    );
  }

  async getAllRoutesOnPage(query: { page?: string; pageSize?: string }) {
    return this.getFromCacheOrFetch('allRoutesOnPage', () =>
      this.rbacRepository.getAllRoutesOnPage(query),
    );
  }

  // 角色路由关联
  async assignRoutesToRole(roleId: string, routeIds: string[]) {
    // 验证角色是否存在
    const role = await this.getRoleById(roleId);
    if (!role) {
      throw new NotFoundException(`角色ID ${roleId} 不存在`);
    }

    // 如果没有提供路由ID，直接清空该角色的所有路由
    if (!routeIds || routeIds.length === 0) {
      const result = await this.rbacRepository.assignRoutesToRole(roleId, []);
      await this.clearRoutesCache(); // 清除缓存，因为角色的路由发生了变化
      return result;
    }

    // 批量验证路由ID是否存在 - 使用Set进行高效查找
    const routes = await this.getAllRoutes();
    const existingRouteIds = new Set(routes.map((route) => route.id));

    const nonExistingRouteIds = routeIds.filter(
      (id) => !existingRouteIds.has(id),
    );
    if (nonExistingRouteIds.length > 0) {
      throw new NotFoundException(
        `以下路由ID不存在: ${nonExistingRouteIds.join(', ')}`,
      );
    }

    const result = await this.rbacRepository.assignRoutesToRole(
      roleId,
      routeIds,
    );
    await this.clearRoutesCache(); // 清除缓存
    return result;
  }

  async getRoleRoutes(roleId: string) {
    return this.getFromCacheOrFetch(`roleRoutes_${roleId}`, async () => {
      const role = await this.getRoleById(roleId);
      if (!role) {
        throw new NotFoundException(`角色ID ${roleId} 不存在`);
      }
      return this.rbacRepository.getRoleRoutes(roleId);
    });
  }

  // 用户角色关联
  async assignRolesToUser(userId: string, roleIds: string[]) {
    if (!userId) {
      throw new BadRequestException('用户ID不能为空');
    }

    // 验证用户是否存在
    const userExists = await this.validateUserExists(userId);
    if (!userExists) {
      throw new NotFoundException(`用户ID ${userId} 不存在`);
    }

    // 如果没有提供角色ID，直接清空该用户的所有角色
    if (!roleIds || roleIds.length === 0) {
      const result = await this.rbacRepository.assignRolesToUser(userId, []);
      await this.clearCache(`userRoles_${userId}`); // 清除用户角色缓存
      await this.clearCache(`userRoutes_${userId}`); // 清除用户路由缓存
      return result;
    }

    // 批量验证角色ID是否存在
    const roles = await this.getAllRoles();
    const existingRoleIds = new Set(roles.map((role) => role.id));

    const nonExistingRoleIds = roleIds.filter((id) => !existingRoleIds.has(id));
    if (nonExistingRoleIds.length > 0) {
      throw new NotFoundException(
        `以下角色ID不存在: ${nonExistingRoleIds.join(', ')}`,
      );
    }

    const result = await this.rbacRepository.assignRolesToUser(userId, roleIds);
    await this.clearCache(`userRoles_${userId}`); // 清除用户角色缓存
    await this.clearCache(`userRoutes_${userId}`); // 清除用户路由缓存
    return result;
  }

  /**
   * 验证用户是否存在
   * @param userId 用户ID
   * @returns 用户是否存在
   */
  private async validateUserExists(userId: string): Promise<boolean> {
    try {
      const user = await this.rbacRepository.getUserById(userId);
      return user !== null;
    } catch (error) {
      throw new InternalServerErrorException(
        `验证用户存在性时发生错误: ${error.message}`,
      );
    }
  }

  async getUserRoles(userId: string) {
    return this.getFromCacheOrFetch(`userRoles_${userId}`, () =>
      this.rbacRepository.getUserRoles(userId),
    );
  }

  // 获取用户可访问的路由
  async getUserAccessibleRoutes(userId: string) {
    return this.getFromCacheOrFetch(`userRoutes_${userId}`, async () => {
      // 获取用户的扁平路由列表
      const routes = await this.rbacRepository.getUserAccessibleRoutes(userId);

      // 如果没有路由，直接返回空数组
      if (!routes || routes.length === 0) {
        return [];
      }

      // 为每个路由添加role字段
      const routesWithRoles = await Promise.all(
        routes.map(async (route) => {
          // 获取该路由关联的所有角色
          const routeRoles = await this.rbacRepository.getRouteRoles(route.id);
          return {
            ...route,
            role: routeRoles.map((r) => r.name),
          };
        }),
      );

      // 构建嵌套的路由树结构
      return this.buildRouteTree(
        routesWithRoles.map((route) => ({
          ...route,
          isHidden: route.isHidden || false, // 确保isHidden为boolean类型
        })),
      );
    });
  }

  /**
   * 将扁平路由列表构建为嵌套的树结构
   * @param routes 扁平的路由列表
   * @returns 嵌套的路由树
   */
  private buildRouteTree(routes: RouteItem[]): RouteItem[] {
    // 先按路径长度排序，确保父路由在前
    const sortedRoutes = [...routes].sort(
      (a, b) =>
        a.path.split('/').length - b.path.split('/').length ||
        a.path.localeCompare(b.path),
    );

    // 创建路由映射，方便快速查找
    const routeMap = new Map<string, RouteItem>();
    sortedRoutes.forEach((route) => {
      routeMap.set(route.id, { ...route, children: [] });
    });

    // 创建根节点列表，存放顶级路由
    const rootRoutes: RouteItem[] = [];

    // 遍历构建树结构
    sortedRoutes.forEach((route) => {
      const routeWithChildren = routeMap.get(route.id);

      if (routeWithChildren && route.parentId && routeMap.has(route.parentId)) {
        // 如果有父路由，则添加为其子路由
        const parentRoute = routeMap.get(route.parentId);
        if (parentRoute && parentRoute.children) {
          parentRoute.children.push(routeWithChildren);
        }
      } else if (routeWithChildren) {
        // 否则作为顶级路由
        rootRoutes.push(routeWithChildren);
      }
    });

    // 递归去除空的children数组
    this.cleanupEmptyChildren(rootRoutes);

    return rootRoutes;
  }

  /**
   * 清理路由树中的空children数组
   * @param routes 路由节点数组
   */
  private cleanupEmptyChildren(routes: RouteItem[]): void {
    routes.forEach((route) => {
      if (route.children && route.children.length === 0) {
        delete route.children;
      } else if (route.children) {
        this.cleanupEmptyChildren(route.children);
      }
    });
  }

  /**
   * 确保默认路由存在
   * 初始化基础路由数据：根路由(/)、数据图表路由(dashboard)、用户管理路由(user-manager)、
   * 路由管理路由(router-manager)和角色管理路由(role-manager)
   */
  private async ensureDefaultRoutesExist() {
    try {
      // 获取所有路由
      const routes = await this.getAllRoutes();

      // 如果已经有路由数据，则不需要初始化
      if (routes && routes.length > 0) {
        return;
      }

      console.log('初始化默认路由数据...');

      // 创建数据图表路由
      await this.rbacRepository.createRoute({
        path: 'dashboard',
        name: '数据图表',
        icon: 'dashboard',
        order: 1,
        role: ['v2mm5'],
      });

      // 创建用户管理路由
      await this.rbacRepository.createRoute({
        path: 'user-manager',
        name: '用户管理',
        icon: 'user',
        order: 2,
        role: ['v2mm5'],
      });

      // 创建路由管理路由
      await this.rbacRepository.createRoute({
        path: 'router-manager',
        name: '路由管理',
        icon: 'router',
        order: 3,
        role: ['v2mm5'],
      });

      // 创建角色管理路由
      await this.rbacRepository.createRoute({
        path: 'role-manager',
        name: '角色管理',
        icon: 'role',
        order: 4,
        role: ['v2mm5'],
      });
      // 清除路由缓存
      await this.clearRoutesCache();

      // 为超级管理员角色分配所有路由
      const superAdminRole =
        await this.rbacRepository.getRoleByName('superadmin');
      if (superAdminRole) {
        // 重新获取所有路由ID
        const allRoutes = await this.getAllRoutes();
        const routeIds = allRoutes.map((route) => route.id);

        // 分配所有路由给超级管理员
        await this.assignRoutesToRole(superAdminRole.id, routeIds);
      }

      // 清除路由缓存
      await this.clearRoutesCache();
      console.log('默认路由初始化完成');
    } catch (error) {
      console.error('初始化默认路由失败:', error.message);
      throw new InternalServerErrorException(
        `初始化默认路由失败: ${error.message}`,
      );
    }
  }
}
