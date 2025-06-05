import { RoleItem } from '@smart-lock/shared';
import { twMerge } from 'tailwind-merge';
import { Badge } from './ui/badge';

function getRoleColor(roleName: string) {
  switch (roleName) {
    case 'superadmin':
      return 'bg-primary';
    case 'admin':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

export default function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      variant="outline"
      className={twMerge('flex gap-1 px-1.5 py-1.5 [&_svg]:size-3 text-white', getRoleColor(role))}
    >
      {role}
    </Badge>
  );
}
