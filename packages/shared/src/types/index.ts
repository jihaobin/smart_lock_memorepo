// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// 智能锁相关类型
export interface Lock {
  id: string;
  name: string;
  status: 'locked' | 'unlocked';
  batteryLevel: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 访问记录相关类型
export interface AccessLog {
  id: string;
  lockId: string;
  userId: string;
  action: 'lock' | 'unlock';
  timestamp: Date;
  method: 'app' | 'keypad' | 'fingerprint' | 'card';
}

// 权限相关类型
export interface Permission {
  id: string;
  lockId: string;
  userId: string;
  role: 'owner' | 'admin' | 'user' | 'guest';
  validFrom: Date;
  validTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}