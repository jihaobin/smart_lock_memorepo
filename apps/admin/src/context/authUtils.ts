import { IAdminAuthUser, RouteItem } from '@smart-lock/shared/shared';

// 存储键常量
export const AUTH_USER_KEY = 'user';
export const AUTH_TOKEN_KEY = 'auth_token';

/**
 * 扁平化路由数组，将嵌套路由结构转换为一维数组
 * @param routes 路由数组
 * @returns 扁平化后的路由数组
 */
export function flattenRoutes(routes: RouteItem[]): RouteItem[] {
  return routes.reduce((acc, route) => {
    acc.push(route);
    if (route.children) {
      acc.push(...flattenRoutes(route.children));
    }
    return acc;
  }, [] as RouteItem[]);
}

/**
 * 检查用户是否有访问特定路由的权限
 * @param user 用户信息
 * @param routePath 路由路径
 * @param flattenedRoutes 扁平化的路由数组
 * @returns 是否有权限
 */
export function checkPermission(
  user: IAdminAuthUser | null,
  routePath: string,
  flattenedRoutes: RouteItem[]
): boolean {
  if (!user) return false;
  return flattenedRoutes.some(route => route.path === routePath);
}

/**
 * 从localStorage加载认证信息
 * @returns 包含用户数据和token的对象
 */
export function loadAuthFromStorage(): { userData: IAdminAuthUser | null; token: string | null } {
  try {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    let userData = null;
    if (savedUser) {
      userData = JSON.parse(savedUser) as IAdminAuthUser;
    }

    return {
      userData,
      token: savedToken,
    };
  } catch (error) {
    console.error('加载认证信息失败:', error);
    return { userData: null, token: null };
  }
}

/**
 * 保存用户信息到localStorage
 * @param userData 用户数据
 */
export function saveUserToStorage(userData: IAdminAuthUser): void {
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('保存用户信息失败:', error);
  }
}

/**
 * 从localStorage中清除用户信息
 */
export function clearUserFromStorage(): void {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (error) {
    console.error('清除用户信息失败:', error);
  }
}
