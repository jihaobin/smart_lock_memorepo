# Verification Code Public Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow unauthenticated registration clients to request `/auth/send_verification_code` while keeping ordinary business endpoints protected.

**Architecture:** Keep the server-side `@Public()` route unchanged and align the shared client's `AuthManager` path classification with it. Add a focused Jest suite inside the shared package so the public-path contract is executable and future omissions are caught before requests are blocked locally.

**Tech Stack:** TypeScript 5, Jest 29, ts-jest, pnpm workspace

---

### Task 1: Add Shared-Package Jest Configuration

**Files:**

- Create: `packages/shared/jest.config.cjs`

- [x] **Step 1: Add the TypeScript Jest configuration**

Create the package-local configuration:

```js
/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
};
```

- [x] **Step 2: Confirm Jest accepts the configuration**

Run:

```powershell
pnpm --filter @smart-lock/shared exec jest --config jest.config.cjs --listTests
```

Expected: exit code 0. No tests are listed yet.

### Task 2: Reproduce the Incorrect Protected-Path Classification

**Files:**

- Create: `packages/shared/src/api/utils/auth-manager.spec.ts`
- Test: `packages/shared/src/api/utils/auth-manager.spec.ts`

- [x] **Step 1: Write the focused path-classification tests**

Create the test suite:

```ts
import { AuthManager } from './auth-manager';

describe('AuthManager public paths', () => {
  const authManager = new AuthManager();

  it.each([
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/send_verification_code',
  ])('allows unauthenticated requests to %s', path => {
    expect(authManager.isProtectedPath(path)).toBe(false);
  });

  it('keeps ordinary business endpoints protected', () => {
    expect(authManager.isProtectedPath('/device/list')).toBe(true);
  });
});
```

- [x] **Step 2: Run the test and verify RED**

Run:

```powershell
pnpm --filter @smart-lock/shared exec jest --config jest.config.cjs --runInBand src/api/utils/auth-manager.spec.ts
```

Expected: one case fails with `Expected: false` and `Received: true` for `/auth/send_verification_code`; the existing public paths and protected business path pass.

### Task 3: Add the Verification-Code Endpoint to the Public Paths

**Files:**

- Modify: `packages/shared/src/api/utils/auth-manager.ts:23`
- Test: `packages/shared/src/api/utils/auth-manager.spec.ts`

- [x] **Step 1: Implement the minimal path-rule change**

Replace the existing protected-path expression with:

```ts
private protectedPaths: RegExp[] = [
  /^\/(?!auth\/(?:login|register|forgot-password|send_verification_code)$|public\/)/,
];
```

The end anchor keeps similarly prefixed paths, such as `/auth/login-history`, protected while allowing only the four exact authentication endpoints.

- [x] **Step 2: Run the focused test and verify GREEN**

Run:

```powershell
pnpm --filter @smart-lock/shared exec jest --config jest.config.cjs --runInBand src/api/utils/auth-manager.spec.ts
```

Expected: all five cases pass.

- [x] **Step 3: Add a boundary assertion for similarly prefixed paths**

Extend the protected-path test:

```ts
it.each(['/device/list', '/auth/login-history'])('keeps %s protected', path => {
  expect(authManager.isProtectedPath(path)).toBe(true);
});
```

Remove the earlier single `/device/list` test so the suite has one protected-path table.

- [x] **Step 4: Re-run the focused test**

Run:

```powershell
pnpm --filter @smart-lock/shared exec jest --config jest.config.cjs --runInBand src/api/utils/auth-manager.spec.ts
```

Expected: all six cases pass.

### Task 4: Verify the Shared Package and Scoped Diff

**Files:**

- Verify: `packages/shared/jest.config.cjs`
- Verify: `packages/shared/src/api/utils/auth-manager.spec.ts`
- Verify: `packages/shared/src/api/utils/auth-manager.ts`

- [x] **Step 1: Run all shared-package tests**

Run:

```powershell
pnpm --filter @smart-lock/shared exec jest --config jest.config.cjs --runInBand
```

Expected: exit code 0 and the `AuthManager public paths` suite passes.

- [x] **Step 2: Build the shared package**

Run:

```powershell
pnpm --filter @smart-lock/shared build
```

Expected: exit code 0 with CommonJS, ESM, and declaration outputs generated successfully.

- [x] **Step 3: Check formatting and whitespace**

Run:

```powershell
pnpm exec prettier --check packages/shared/jest.config.cjs packages/shared/src/api/utils/auth-manager.spec.ts packages/shared/src/api/utils/auth-manager.ts
git diff --check -- packages/shared/jest.config.cjs packages/shared/src/api/utils/auth-manager.spec.ts packages/shared/src/api/utils/auth-manager.ts
```

Expected: Prettier reports all files formatted and `git diff --check` exits with code 0.

- [x] **Step 4: Review only the scoped changes**

Run:

```powershell
git diff -- packages/shared/jest.config.cjs packages/shared/src/api/utils/auth-manager.spec.ts packages/shared/src/api/utils/auth-manager.ts docs/superpowers/plans/2026-07-13-verification-code-public-path.md
```

Expected: only the Jest setup, regression tests, exact public-path rule, and this implementation plan appear. Do not stage or commit implementation files unless the user explicitly requests it.
