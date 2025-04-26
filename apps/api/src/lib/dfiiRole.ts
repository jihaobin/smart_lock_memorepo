/**
 * 判断角色1是否比角色2的权限大(superadmin > admin > other)
 * @param role1 角色1
 * @param role2 角色2
 */
export default function diffRole(role1: string, role2: string): boolean {
  const roleHierarchy: Record<string, number> = {
    superadmin: 2,
    admin: 1,
  };

  // 获取角色对应的权限等级，未在 hierarchy 中定义的角色等级为 0
  const level1 = roleHierarchy[role1] ?? 0;
  const level2 = roleHierarchy[role2] ?? 0;

  // 比较等级
  return level1 > level2;
}
