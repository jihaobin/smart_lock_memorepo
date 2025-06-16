import { RouteItem } from '@smart-lock/shared/shared';
import { IconInnerShadowTop } from '@tabler/icons-react';
import { Link, useLocation } from '@tanstack/react-router';
import * as React from 'react';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';

import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

// 用户数据
const userData = {
  name: 'shadcn',
  email: 'm@example.com',
  avatar: '/avatars/shadcn.jpg',
};

// 构建菜单树结构
const buildMenuTree = (routes: RouteItem[]) => {
  // 创建一个映射表，用于快速查找路由
  const routeMap = new Map<string, RouteItem & { children: RouteItem[] }>();

  // 首先将所有路由添加到映射中
  routes.forEach(route => {
    routeMap.set(route.id, {
      ...route,
      children: [],
    });
  });

  // 构建树结构
  const menuItems: RouteItem[] = [];

  routes.forEach(route => {
    const menuItem = routeMap.get(route.id);

    if (menuItem) {
      if (route.parentId && routeMap.has(route.parentId)) {
        // 如果有父节点，添加为子项
        const parentItem = routeMap.get(route.parentId);
        if (parentItem) {
          parentItem.children.push(menuItem);
        }
      } else {
        // 否则添加为顶级菜单
        menuItems.push(menuItem);
      }
    }
  });

  // 按照order排序
  const sortItems = (items: RouteItem[]) => {
    items.sort((a, b) => {
      const orderA = a.order || 0;
      const orderB = b.order || 0;
      return orderA - orderB;
    });

    items.forEach(item => {
      if (item.children && item.children.length > 0) {
        sortItems(item.children);
      }
    });
  };

  sortItems(menuItems);
  return menuItems;
};

// 渲染菜单项组件
const RenderMenuItem = ({ item }: { item: RouteItem }) => {
  const location = useLocation();

  // 判断当前菜单项是否处于激活状态
  const isActive = React.useMemo(() => {
    const itemPath = item.path.startsWith('/') ? item.path : `/${item.path}`;
    const currentPath = location.pathname;

    // 精确匹配或路径前缀匹配
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  }, [item.path, location.pathname]);

  // 渲染图标
  const renderIcon = () => {
    if (item.icon) {
      return (
        <DynamicIcon
          name={item.icon as IconName}
          className={`transition-all will-change-transform ${
            isActive ? 'text-sidebar-primary font-medium' : ''
          }`}
        />
      );
    }
    return null;
  };

  return (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        asChild
        tooltip={item.name}
        className={`transition-all duration-300 ease-in-out hover:bg-sidebar-accent/10 hover:translate-x-1 ${
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm border-l-2 border-sidebar-primary'
            : ''
        }`}
        data-active={isActive}
      >
        <Link to={item.path.startsWith('/') ? item.path : `/${item.path}`}>
          {renderIcon()}
          <span
            className={`transition-all will-change-transform ${
              isActive ? 'text-sidebar-primary font-medium' : ''
            }`}
          >
            {item.name}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

// 渲染子菜单组件
const RenderSubMenu = ({ items }: { items: RouteItem[] }) => {
  return (
    <SidebarMenu>
      {items.map(item => {
        // 如果有子项且子项不为空，渲染子菜单组
        if (item.children && item.children.length > 0) {
          return (
            <SidebarGroup key={item.id}>
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">
                {item.name}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <RenderSubMenu items={item.children} />
              </SidebarGroupContent>
            </SidebarGroup>
          );
        }
        // 否则渲染单个菜单项
        return <RenderMenuItem key={item.id} item={item} />;
      })}
    </SidebarMenu>
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { accessibleRoutes } = useAuth();

  // 构建菜单树
  const menuItems = React.useMemo(() => {
    // 过滤掉不应该显示在菜单中的路由
    const menuRoutes = accessibleRoutes.filter(route => {
      // 过滤条件：
      // 1. 不是隐藏的路由
      // 2. 不是登录、注册等认证相关路由
      // 3. 不是错误页面路由
      const isHidden = route.isHidden === true;
      const isAuthRoute = route.path.includes('/login') || route.path.includes('/register');
      const isErrorRoute = route.path.includes('/404') || route.path.includes('/error');

      const shouldShow = !isHidden && !isAuthRoute && !isErrorRoute;
      return shouldShow;
    });
    const tree = buildMenuTree(menuRoutes);
    return tree;
  }, [accessibleRoutes]);

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-sidebar-border bg-sidebar shadow-md transition-all duration-300 ease-in-out"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 font-bold transition-all duration-300 hover:text-sidebar-primary"
            >
              <Link to="/">
                <IconInnerShadowTop className="size-5 animate-pulse text-sidebar-primary" />
                <span className="text-base font-semibold bg-gradient-to-r from-sidebar-primary to-sidebar-foreground bg-clip-text text-transparent">
                  Acme Inc.
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <RenderSubMenu items={menuItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
