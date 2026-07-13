# Default Route Role ID Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make default route initialization bind routes to the current database's `superadmin` role ID instead of a hard-coded ID.

**Architecture:** Keep initialization in `RbacService` and resolve the system role through the existing `RbacRepository.getRoleByName` boundary. Test the initialization behavior with Jest by invoking the private startup helper and mocking only repository and cache dependencies.

**Tech Stack:** NestJS 11, TypeScript, Jest 29, ts-jest, Drizzle ORM

---

### Task 1: Add Regression Tests

**Files:**

- Create: `apps/api/src/modules/admin/rbac/rbac.service.spec.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/src/modules/admin/rbac/rbac.service.spec.ts`

- [x] **Step 1: Write failing tests for dynamic role binding and missing role handling**

Create a `RbacService` with mocked `RbacRepository`, `AdminAuthRepository`, configuration, and cache. Invoke `ensureDefaultRoutesExist` through a narrow test-only type cast. Use `superadmin-role-id` as the repository result and assert every `createRoute` call receives `role: ['superadmin-role-id']`. Add a second test where `getRoleByName` returns `undefined`, then assert initialization rejects with `superadmin` in the message and does not call `createRoute`.

```ts
const initializeDefaultRoutes = (service: RbacService) =>
  (
    service as unknown as {
      ensureDefaultRoutesExist(): Promise<void>;
    }
  ).ensureDefaultRoutesExist();

expect(rbacRepository.createRoute).toHaveBeenCalledTimes(4);
for (const [route] of rbacRepository.createRoute.mock.calls) {
  expect(route.role).toEqual(['superadmin-role-id']);
}
```

- [x] **Step 2: Run the focused test and verify RED**

Run:

```powershell
pnpm --filter @smart-lock/api exec jest --runInBand src/modules/admin/rbac/rbac.service.spec.ts
```

Expected: the dynamic role assertion fails because calls contain `v2mm5`; the missing-role test fails because route creation starts before role validation.

### Task 2: Resolve the Superadmin Role Before Route Creation

**Files:**

- Modify: `apps/api/src/modules/admin/rbac/rbac.service.ts:588`
- Test: `apps/api/src/modules/admin/rbac/rbac.service.spec.ts`

- [x] **Step 1: Implement the minimal production fix**

After confirming there are no existing routes, resolve `superadmin` once and fail clearly if absent:

```ts
const superAdminRole = await this.rbacRepository.getRoleByName('superadmin');
if (!superAdminRole) {
  throw new Error('无法找到superadmin角色，请确保先初始化默认角色');
}
```

Replace each `role: ['v2mm5']` with:

```ts
role: [superAdminRole.id],
```

Reuse the same `superAdminRole` for the final `assignRoutesToRole` call and remove the redundant second lookup and nullable branch.

- [x] **Step 2: Run the focused test and verify GREEN**

Run:

```powershell
pnpm --filter @smart-lock/api exec jest --runInBand src/modules/admin/rbac/rbac.service.spec.ts
```

Expected: both regression tests pass.

### Task 3: Verify the API Package

**Files:**

- Verify: `apps/api/src/modules/admin/rbac/rbac.service.ts`
- Verify: `apps/api/src/modules/admin/rbac/rbac.service.spec.ts`

- [x] **Step 1: Confirm the hard-coded ID is absent from production code**

Run:

```powershell
rg -n "v2mm5" apps/api/src
```

Expected: no matches.

- [x] **Step 2: Build the API package**

Run:

```powershell
pnpm --filter @smart-lock/api build
```

Expected: exit code 0.

- [x] **Step 3: Review only the scoped diff**

Run:

```powershell
git diff -- apps/api/src/modules/admin/rbac/rbac.service.ts apps/api/src/modules/admin/rbac/rbac.service.spec.ts docs/superpowers/specs/2026-07-13-default-route-role-id-fix-design.md docs/superpowers/plans/2026-07-13-default-route-role-id-fix.md
```

Expected: only the dynamic role lookup, regression tests, and approved documentation are present. No commit is created because the user did not authorize Git commits.
