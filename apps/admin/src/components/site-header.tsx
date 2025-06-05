import { useMatches, useRouter } from '@tanstack/react-router';
import { Home } from 'lucide-react';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { DynamicIcon, IconName } from 'lucide-react/dynamic';

export function SiteHeader() {
  const router = useRouter();
  const matches = useMatches();
  const { accessibleRoutes } = useAuth();
  const [isPending, startTransition] = React.useTransition();
  const [breadcrumbs, setBreadcrumbs] = React.useState<any[]>([]);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  console.log(matches);

  // 使用useMemo缓存路径到路由的映射关系
  const routePathMap = React.useMemo(() => {
    const map = new Map();
    accessibleRoutes.forEach(route => {
      const routePath = route.path.startsWith('/') ? route.path : `/${route.path}`;
      const normalizedRoutePath = routePath === '/' ? '/' : routePath.replace(/\/$/, '');
      map.set(normalizedRoutePath, route);
    });
    return map;
  }, [accessibleRoutes]);

  // 根据路径查找对应的服务器路由数据
  const findRouteByPath = React.useCallback(
    (path: string) => {
      const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
      return routePathMap.get(normalizedPath);
    },
    [routePathMap]
  );

  // 渲染图标
  const renderIcon = React.useCallback(
    (serverIcon: string | null | undefined, fallbackIcon: React.ReactNode) => {
      if (serverIcon) {
        // 如果有服务器图标，渲染服务器图标
        return (
          <DynamicIcon
            name={serverIcon as IconName}
            className="transition-all will-change-transform text-sidebar-primary font-medium"
          />
        );
      }
      // 否则使用降级图标
      return fallbackIcon;
    },
    []
  );

  // 深度比较函数
  const deepEqual = React.useCallback((a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => {
      const bItem = b[index];
      return item.path === bItem.path && item.name === bItem.name;
    });
  }, []);

  // 生成面包屑数据的函数
  const generateBreadcrumbs = React.useCallback(() => {
    // 使用useMatches()获取当前匹配的路由信息
    const filteredMatches = matches.filter(match => match.id !== '__root__');

    // 检测并删除重复的根路径，只保留一个
    const pathMap = new Map();
    const dedupedMatches = filteredMatches.filter(match => {
      if (match.pathname === '/' && pathMap.has('/')) {
        return false;
      }
      pathMap.set(match.pathname, true);
      return true;
    });

    const newBreadcrumbs = dedupedMatches.map(match => {
      // 获取路由的静态数据
      const routeStatic = match.staticData || {};

      // 查找对应的服务器路由数据
      const serverRoute = findRouteByPath(match.pathname);

      // 优先使用服务器路由的名称和图标
      const name = serverRoute?.name || routeStatic.title || '首页';
      const fallbackIcon = routeStatic.icon || (match.pathname === '/' ? <Home size={16} /> : null);
      const icon = renderIcon(serverRoute?.icon, fallbackIcon);

      return {
        path: match.pathname,
        name,
        icon,
      };
    });

    return newBreadcrumbs;
  }, [matches, findRouteByPath, renderIcon]);

  // 使用useEffect和防抖来控制面包屑更新
  React.useEffect(() => {
    // 清除之前的定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 设置防抖延迟
    debounceTimerRef.current = setTimeout(() => {
      const newBreadcrumbs = generateBreadcrumbs();

      // 只有当新数据与当前数据不同时才更新
      if (!deepEqual(breadcrumbs, newBreadcrumbs)) {
        setBreadcrumbs(newBreadcrumbs);
      }
    }, 100); // 150ms 防抖延迟

    // 清理函数
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [matches, accessibleRoutes, generateBreadcrumbs, deepEqual, breadcrumbs]);

  // 显示的面包屑数据
  const displayBreadcrumbs = breadcrumbs;

  return (
    <header className="sticky top-0 flex h-12 shrink-0 items-center border-b bg-gradient-to-r from-background to-card backdrop-blur-sm transition-all duration-300 ease-in-out group-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 transition-colors duration-300 hover:text-primary" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="animate-in fade-in-5 duration-500">
          <BreadcrumbList>
            {displayBreadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={`${breadcrumb.path}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="flex items-center">
                  {index === displayBreadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="flex items-center gap-1 font-medium text-foreground transition-all duration-300 hover:text-primary">
                      <span
                        className="flex items-center gap-1 transition-all duration-300 ease-in-out"
                        style={{
                          animationDelay: `${index * 75}ms`,
                          opacity: isPending ? 0.8 : 1,
                          transform: isPending ? 'translateY(-0.5px)' : 'translateY(0)',
                        }}
                      >
                        {breadcrumb.icon && (
                          <span className="text-primary transition-all duration-300 ease-in-out">
                            {breadcrumb.icon}
                          </span>
                        )}
                        <span className="transition-all duration-300 ease-in-out">
                          {breadcrumb.name}
                        </span>
                      </span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="flex items-center gap-1 transition-all duration-300 hover:text-primary"
                      onClick={() => {
                        startTransition(() => {
                          router.navigate({ to: breadcrumb.path });
                        });
                      }}
                    >
                      <span
                        className="flex items-center gap-1 transition-all duration-300 ease-in-out"
                        style={{
                          animationDelay: `${index * 75}ms`,
                          opacity: isPending ? 0.8 : 1,
                          transform: isPending ? 'translateY(-0.5px)' : 'translateY(0)',
                        }}
                      >
                        {breadcrumb.icon && (
                          <span className="text-primary/70 transition-all duration-300 ease-in-out">
                            {breadcrumb.icon}
                          </span>
                        )}
                        <span className="transition-all duration-300 ease-in-out">
                          {breadcrumb.name}
                        </span>
                      </span>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
