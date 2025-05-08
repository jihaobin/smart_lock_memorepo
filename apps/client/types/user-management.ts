export interface AuthorizedUser {
  id: string;
  userId: string;
  remarkName: string;
  linkedPasswords: string;
  friendGroupId: string;
}

export interface Group {
  id: string;
  groupName: string;
}

// 额外类型定义
export interface Tab {
  key: string;
  title: string;
}
