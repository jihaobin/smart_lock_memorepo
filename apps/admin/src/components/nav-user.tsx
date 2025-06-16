import { IconDotsVertical, IconLogout, IconUser } from '@tabler/icons-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAuth } from '@/context/AuthContext';

export function NavUser({
  user,
  className,
}: {
  user: {
    name: string;
    role: string;
  };
  className?: string;
}) {
  const { logout } = useAuth();

  return (
    <SidebarMenu className={className}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group relative overflow-hidden transition-all duration-300 ease-in-out data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100" />
              <div className="h-8 w-8 rounded-lg bg-sidebar-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-sidebar-primary/20 hover:ring-2 hover:ring-sidebar-primary/50 hover:ring-offset-1">
                <IconUser className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium transition-colors duration-300 group-hover:text-sidebar-primary">
                  {user.name}
                </span>
                <span className="text-muted-foreground truncate text-xs transition-colors duration-300 group-hover:text-sidebar-primary/70">
                  {user.role}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:text-sidebar-primary" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg border shadow-md animate-in fade-in-25 zoom-in-90 dark:bg-card"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center ring-2 ring-primary/20 ring-offset-1">
                  <IconUser className="h-5 w-5 text-primary" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-foreground">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.role}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="transition-colors duration-200 hover:bg-destructive/5 focus:bg-destructive/10"
              onClick={logout}
            >
              <IconLogout className="text-destructive mr-2" />
              <span>切换账号</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
