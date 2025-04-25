import { useRouter, useMatches } from '@tanstack/react-router';
import { Home } from 'lucide-react';
import React from 'react';

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

export function SiteHeader() {
  const router = useRouter();
  const matches = useMatches();
  console.log(matches);

  // 生成带图标的面包屑
  const generateBreadcrumbs = () => {
    // 使用useMatches()获取当前匹配的路由信息
    // matches数组包含了从根路由到当前路由的所有匹配路由
    // 过滤掉特殊的根路由 __root__，避免重复的面包屑项
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

    const breadcrumbs = dedupedMatches.map(match => {
      // 获取路由的静态数据
      const routeStatic = match.staticData || {};

      return {
        path: match.pathname,
        name: routeStatic.title || '首页',
        icon: routeStatic.icon || (match.pathname === '/' ? <Home size={16} /> : null),
      };
    });

    // 如果没有匹配到任何路由，至少添加首页
    // if (breadcrumbs.length === 0) {
    //   breadcrumbs.push({
    //     path: "/",
    //     name: "首页",
    //     icon: <Home size={16} />
    //   })
    // }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="sticky top-0 z-999 flex h-12 shrink-0 items-center border-b bg-gradient-to-r from-background to-card backdrop-blur-sm transition-all duration-300 ease-in-out group-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 transition-colors duration-300 hover:text-primary" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb className="animate-in fade-in-5 duration-500">
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={`${breadcrumb.path}-${index}`}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem className="flex items-center">
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="flex items-center gap-1 font-medium text-foreground transition-colors duration-300 hover:text-primary">
                      <span
                        className="flex items-center gap-1 animate-in fade-in duration-300"
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        {breadcrumb.icon && <span className="text-primary">{breadcrumb.icon}</span>}
                        {breadcrumb.name}
                      </span>
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="flex items-center gap-1 transition-colors duration-300 hover:text-primary"
                      onClick={() => router.navigate({ to: breadcrumb.path })}
                    >
                      <span
                        className="flex items-center gap-1 animate-in fade-in duration-300"
                        style={{ animationDelay: `${index * 75}ms` }}
                      >
                        {breadcrumb.icon && (
                          <span className="text-primary/70">{breadcrumb.icon}</span>
                        )}
                        {breadcrumb.name}
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
