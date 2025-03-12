// 用户管理模块的类型定义
export interface AuthorizedUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  group: string;
  permissions: Permission[];
  lastAccess: string;
  avatar?: string;
}

export interface Permission {
  doorId: string;
  type: "permanent" | "temporary";
  validUntil?: string;
}

export interface Group {
  id: string;
  name: string;
  type: string;
}

// 额外类型定义
export interface Tab {
  key: string;
  title: string;
}

export interface UserManagementState {
  // Tab相关状态
  activeTab: number;
  tabs: Tab[];

  // 状态变量
  searchText: string;
  showQRCode: boolean;
  isEditing: boolean;
  selectedGroup: string | null;
  groups: Group[];
  authorizedUsers: AuthorizedUser[];
  editedUser: AuthorizedUser | null;

  // 模态框状态
  showAddUserDialog: boolean;
  showAddGroupDialog: boolean;
  showEditUserDialog: boolean;
  showEditGroupDialog: boolean;
  showDeleteUserDialog: boolean;
  showDeleteGroupDialog: boolean;
  showUserActionDialog: boolean;
  showGroupActionDialog: boolean;
  
  // 新建和编辑状态
  newUser: Partial<AuthorizedUser>;
  newGroup: Partial<Group>;
  selectedUser: AuthorizedUser | null;
  selectedGroupForEdit: Group | null;
}
