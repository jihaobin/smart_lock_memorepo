# 默认路由角色 ID 修复设计

## 问题

`RbacService.ensureDefaultRoutesExist` 为四条默认路由写死角色 ID `v2mm5`。角色表的 ID 由 `createId()` 动态生成，因此新数据库中的 `superadmin` 通常不是该 ID，导致 API 在模块初始化阶段失败。

## 设计

默认路由初始化开始后，先通过 `RbacRepository.getRoleByName('superadmin')` 获取当前数据库中的超级管理员角色。若角色不存在，则抛出包含明确原因的错误；若存在，四次 `createRoute` 调用均传入 `role: [superAdminRole.id]`。

保留初始化末尾的 `assignRoutesToRole(superAdminRole.id, routeIds)`，确保超级管理员获得数据库中的全部路由，而不只是本次创建的默认路由。

## 范围

- 修改 `apps/api/src/modules/admin/rbac/rbac.service.ts`。
- 添加或更新 RBAC 服务单元测试。
- 补充 API Jest 对 `src/*` 绝对导入的路径映射，使服务单元测试可以加载生产模块。
- 不修改数据库内容、数据库结构或角色 ID 生成方式。
- 不调整其他角色和路由权限语义。

## 验证

回归测试使用一个非 `v2mm5` 的超级管理员角色 ID，验证：

1. 四条默认路由均绑定运行时查询到的角色 ID。
2. 初始化结束后仍使用同一角色 ID 分配全部路由。
3. 生产代码不再包含默认路由角色 ID `v2mm5`。
