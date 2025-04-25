import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { toast } from 'sonner';

import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { loadAuthFromStorage, flattenRoutes, checkPermission } from '@/context/authUtils';

export const Route = createFileRoute('/_auth')({
  component: RouteComponent,
  beforeLoad: ({location }) => {
    const currentRoute = location.pathname.split('/')[1];
    const {userData} = loadAuthFromStorage();
    if (!userData) {
      toast.error('请先登录',{
        description: "请登录后再访问"
      });
      throw redirect({
        to: '/login',
      })
    }
    if(location.pathname === "/"){
      return true;
    }
    const routers = flattenRoutes(userData.accessibleRoutes)
    const isTo = checkPermission(userData, currentRoute, routers);
    if (!isTo) {
      toast.error('权限不足',{
        description: "当前用户的角色没有访问该路由的权限，请更换为有权限的账号后重新进行访问"
      });
      throw redirect({
        to: '/login',
        search: {
          Error: "access denied"
        }
      })
    }
  },
})

function RouteComponent() {
  return (
<SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>
            <SiteHeader />
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
  )

}
