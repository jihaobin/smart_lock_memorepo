import React, { createContext, useContext, ReactNode } from 'react';

import { useGroups } from '@/hooks/useGroups';
import { useUIState } from '@/hooks/useUIState';
import { useUsers } from '@/hooks/useUsers';
import type { AuthorizedUser, Group } from '@/types/user-management';

// 定义上下文类型
interface UserManagementContextType {
  // 用户数据和方法
  users: AuthorizedUser[];
  filteredUsers: AuthorizedUser[];
  createUser: (userData: AuthorizedUser) => Promise<AuthorizedUser>;
  updateUser: (id: string, userData: Partial<AuthorizedUser>) => Promise<AuthorizedUser>;
  deleteUser: (id: string, userName: string) => Promise<void>;
  isLoadingUsers: boolean;
  isMutatingUser: boolean;

  // 群组数据和方法
  groups: Group[];
  groupNameMap: Record<string, string>;
  createGroup: (groupData: Partial<Group>) => void;
  updateGroup: (groupData: Group) => void;
  deleteGroup: (id: string, groupName: string) => void;
  isLoadingGroups: boolean;
  isMutatingGroup: boolean;

  // 认证方法
  auth: {
    updateNFC: (userId: string, nfcData: string[]) => Promise<AuthorizedUser>;
    updateFingerprint: (userId: string, fingerprintData: string[]) => Promise<AuthorizedUser>;
    updateFace: (userId: string, faceData: string) => Promise<AuthorizedUser>;
    updateEyes: (userId: string, eyesData: string[]) => Promise<AuthorizedUser>;
    updateDevices: (userId: string, devices: string[]) => Promise<AuthorizedUser>;
    updateLockPassword: (userId: string, password: string) => Promise<AuthorizedUser>;
  };

  // UI状态
  ui: ReturnType<typeof useUIState>;

  // 刷新数据
  refetchUsers: () => Promise<void>;
  refetchGroups: () => Promise<void>;
}

// 创建上下文
const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

// 上下文提供者组件
export function UserManagementProvider({ children }: { children: ReactNode }) {
  // 获取各模块数据和方法
  const users = useUsers();
  const groups = useGroups();
  const ui = useUIState();

  // 根据UI筛选条件过滤用户
  const filteredUsers = users.filterUsers(ui.searchText, ui.selectedGroup);

  // 刷新数据
  const refetchUsers = async () => {
    await users.refetch();
  };

  const refetchGroups = async () => {
    await groups.refetch();
  };

  // 组合上下文值
  const contextValue: UserManagementContextType = {
    // 用户相关
    users: users.users,
    filteredUsers,
    createUser: users.createUser,
    updateUser: users.updateUser,
    deleteUser: users.deleteUser,
    isLoadingUsers: users.status.isLoading,
    isMutatingUser: users.status.isMutating,

    // 群组相关
    groups: groups.groups,
    groupNameMap: groups.groupNameMap,
    createGroup: groups.createGroup,
    updateGroup: groups.updateGroup,
    deleteGroup: groups.deleteGroup,
    isLoadingGroups: groups.status.isLoading,
    isMutatingGroup: groups.status.isMutating,

    // 认证方法
    auth: users.auth,

    // UI状态
    ui,

    // 刷新数据
    refetchUsers,
    refetchGroups,
  };

  return (
    <UserManagementContext.Provider value={contextValue}>{children}</UserManagementContext.Provider>
  );
}

// 使用上下文的钩子
export function useUserManagement() {
  const context = useContext(UserManagementContext);
  if (context === undefined) {
    throw new Error('useUserManagement 必须在 UserManagementProvider 内部使用');
  }
  return context;
}
