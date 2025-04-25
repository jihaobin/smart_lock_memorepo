import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from '@tabler/icons-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group relative overflow-hidden transition-all duration-300 ease-in-out data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-sidebar-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 ease-in-out group-hover:opacity-100" />
              <Avatar className="h-8 w-8 rounded-lg grayscale transition-all duration-300 group-hover:grayscale-0 hover:ring-2 hover:ring-sidebar-primary/50 hover:ring-offset-1">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
                  CN
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium transition-colors duration-300 group-hover:text-sidebar-primary">
                  {user.name}
                </span>
                <span className="text-muted-foreground truncate text-xs transition-colors duration-300 group-hover:text-sidebar-primary/70">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4 transition-transform duration-300 group-hover:rotate-90 group-hover:text-sidebar-primary" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg border shadow-md animate-in fade-in-25 zoom-in-90 dark:bg-card"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg ring-2 ring-primary/20 ring-offset-1">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg bg-primary/20 text-primary">
                    CN
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-foreground">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="transition-colors duration-200 hover:bg-primary/5 focus:bg-primary/10">
                <IconUserCircle className="text-primary mr-2" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="transition-colors duration-200 hover:bg-primary/5 focus:bg-primary/10">
                <IconCreditCard className="text-primary mr-2" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="transition-colors duration-200 hover:bg-primary/5 focus:bg-primary/10">
                <IconNotification className="text-primary mr-2" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="transition-colors duration-200 hover:bg-destructive/5 focus:bg-destructive/10">
              <IconLogout className="text-destructive mr-2" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
