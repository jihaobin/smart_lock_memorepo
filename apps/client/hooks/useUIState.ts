import { useState, useRef } from 'react';
import { ScrollView } from 'react-native';

import type { AuthorizedUser, Group, Tab } from '@/types/user-management';

/**
 * UI状态管理钩子 - 专注于界面状态的管理
 * 包含选项卡、模态框、搜索、编辑等状态管理
 */
export function useUIState() {
  const scrollViewRef = useRef<ScrollView>(null);

  // Tab相关状态
  const [activeTab, setActiveTab] = useState(0);
  const tabs: Tab[] = [
    { key: 'authorized', title: '授权用户' },
    { key: 'profile', title: '个人信息' },
  ];

  // 筛选和搜索状态
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // 用户相关模态框状态
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showUserActionDialog, setShowUserActionDialog] = useState(false);

  // 编辑用户状态
  const [newUser, setNewUser] = useState<Partial<AuthorizedUser>>({});
  const [editingUser, setEditingUser] = useState<AuthorizedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AuthorizedUser | null>(null);
  const [selectedActionUser, setSelectedActionUser] = useState<AuthorizedUser | null>(null);
  const [editedUser, setEditedUser] = useState<AuthorizedUser | null>(null);

  // 群组相关模态框状态
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showGroupActionDialog, setShowGroupActionDialog] = useState(false);

  // 编辑群组状态
  const [newGroup, setNewGroup] = useState<Partial<Group>>({});
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [selectedActionGroup, setSelectedActionGroup] = useState<Group | null>(null);

  // 滚动处理
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollViewRef.current) {
      const scrollAmount = 100;
      scrollViewRef.current.scrollTo({
        x: direction === 'left' ? -scrollAmount : scrollAmount,
        animated: true,
      });
    }
  };

  // 用户动作处理
  const userActions = {
    handleAction: (user: AuthorizedUser) => {
      setSelectedActionUser(user);
      setShowUserActionDialog(true);
    },

    handleEdit: (user: AuthorizedUser) => {
      setEditingUser(user);
      setShowEditUserDialog(true);
      setShowUserActionDialog(false);
    },

    handleDelete: (user: AuthorizedUser) => {
      setUserToDelete(user);
      setShowDeleteUserDialog(true);
      setShowUserActionDialog(false);
    },

    clearModal: () => {
      setShowAddUserDialog(false);
      setShowEditUserDialog(false);
      setShowDeleteUserDialog(false);
      setShowUserActionDialog(false);
      setUserToDelete(null);
      setSelectedActionUser(null);
      setEditingUser(null);
      setNewUser({});
    },
  };

  // 群组动作处理
  const groupActions = {
    handleAction: (group: Group) => {
      setSelectedActionGroup(group);
      setShowGroupActionDialog(true);
    },

    handleEdit: (group: Group) => {
      setEditingGroup(group);
      setShowEditGroupDialog(true);
      setShowGroupActionDialog(false);
    },

    handleDelete: (group: Group) => {
      setGroupToDelete(group);
      setShowDeleteGroupDialog(true);
      setShowGroupActionDialog(false);
    },

    clearModal: () => {
      setShowAddGroupDialog(false);
      setShowEditGroupDialog(false);
      setShowDeleteGroupDialog(false);
      setShowGroupActionDialog(false);
      setGroupToDelete(null);
      setSelectedActionGroup(null);
      setEditingGroup(null);
      setNewGroup({});
    },
  };

  return {
    // 引用
    scrollViewRef,

    // Tab 状态
    activeTab,
    setActiveTab,
    tabs,

    // 筛选状态
    searchText,
    setSearchText,
    selectedGroup,
    setSelectedGroup,

    // 编辑状态
    isEditing,
    setIsEditing,
    showQRCode,
    setShowQRCode,
    editedUser,
    setEditedUser,

    // 用户模态框状态
    showAddUserDialog,
    setShowAddUserDialog,
    showEditUserDialog,
    setShowEditUserDialog,
    showDeleteUserDialog,
    setShowDeleteUserDialog,
    showUserActionDialog,
    setShowUserActionDialog,

    // 用户编辑状态
    newUser,
    setNewUser,
    editingUser,
    setEditingUser,
    userToDelete,
    setUserToDelete,
    selectedActionUser,
    setSelectedActionUser,

    // 群组模态框状态
    showAddGroupDialog,
    setShowAddGroupDialog,
    showEditGroupDialog,
    setShowEditGroupDialog,
    showDeleteGroupDialog,
    setShowDeleteGroupDialog,
    showGroupActionDialog,
    setShowGroupActionDialog,

    // 群组编辑状态
    newGroup,
    setNewGroup,
    editingGroup,
    setEditingGroup,
    groupToDelete,
    setGroupToDelete,
    selectedActionGroup,
    setSelectedActionGroup,

    // 操作方法
    handleScroll,
    userActions,
    groupActions,
  };
}
