import { useState, useRef } from "react";
import { ScrollView } from "react-native";
import { useToast } from "@/hooks/use-toast";
import type { AuthorizedUser, Group } from "@/types/user-management";

export function useUserManagement() {
  const { toast } = useToast();
  const scrollViewRef = useRef<ScrollView>(null);

  // Tab相关状态
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { key: "authorized", title: "授权用户" },
    { key: "profile", title: "个人信息" },
  ];

  // 状态变量
  const [searchText, setSearchText] = useState("");
  const [showQRCode, setShowQRCode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([
    { id: "1", name: "家人", type: "user" },
    { id: "2", name: "朋友", type: "user" },
    { id: "3", name: "同事", type: "user" },
  ]);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([
    {
      id: "1",
      name: "张三",
      email: "zhangsan@example.com",
      phone: "13800138001",
      group: "1",
      permissions: [{ doorId: "1", type: "permanent" }],
      lastAccess: "今天 14:30",
    },
    {
      id: "2",
      name: "李四",
      email: "lisi@example.com",
      phone: "13800138002",
      group: "2",
      permissions: [
        { doorId: "1", type: "temporary", validUntil: "2024-12-31" },
      ],
      lastAccess: "昨天 16:45",
    },
  ]);

  const [editedUser, setEditedUser] = useState<AuthorizedUser | null>({
    id: "0",
    name: "当前用户",
    group: "1",
    permissions: [{ doorId: "1", type: "permanent" }],
    lastAccess: "刚刚"
  });

  // 模态框状态
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showUserActionDialog, setShowUserActionDialog] = useState(false);
  const [showGroupActionDialog, setShowGroupActionDialog] = useState(false);

  // 编辑状态
  const [newUser, setNewUser] = useState<Partial<AuthorizedUser>>({});
  const [newGroup, setNewGroup] = useState<Partial<Group>>({});
  const [editingUser, setEditingUser] = useState<AuthorizedUser | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [userToDelete, setUserToDelete] = useState<AuthorizedUser | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [selectedActionUser, setSelectedActionUser] = useState<AuthorizedUser | null>(null);
  const [selectedActionGroup, setSelectedActionGroup] = useState<Group | null>(null);

  // 过滤用户
  const filteredUsers = authorizedUsers
    .filter(user => 
      searchText === "" || 
      user.name.includes(searchText) || 
      user.email?.includes(searchText) || 
      user.phone?.includes(searchText)
    )
    .filter(user => 
      selectedGroup === null || user.group === selectedGroup
    );

  const handleScroll = (direction: "left" | "right") => {
    if (scrollViewRef.current) {
      const scrollAmount = 100;
      scrollViewRef.current.scrollTo({
        x: direction === "left" ? -scrollAmount : scrollAmount,
        animated: true,
      });
    }
  };

  // 操作用户
  const handleUserAction = (user: AuthorizedUser) => {
    setSelectedActionUser(user);
    setShowUserActionDialog(true);
  };

  const handleEditUser = (user: AuthorizedUser) => {
    setEditingUser(user);
    setShowEditUserDialog(true);
    setShowUserActionDialog(false);
  };

  const handleDeleteUser = (user: AuthorizedUser) => {
    setUserToDelete(user);
    setShowDeleteUserDialog(true);
    setShowUserActionDialog(false);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      try {
        setAuthorizedUsers(
          authorizedUsers.filter((u) => u.id !== userToDelete.id)
        );
        setShowDeleteUserDialog(false);
        setUserToDelete(null);
        toast({
          title: "用户已删除",
          description: `用户 "${userToDelete.name}" 已成功删除。`,
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "删除用户失败",
          description: "删除用户时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddUser = () => {
    try {
      const id = (authorizedUsers.length + 1).toString();
      const user: AuthorizedUser = {
        ...(newUser as AuthorizedUser),
        id,
        permissions: [
          {
            doorId: "1",
            type: "temporary",
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          },
        ],
        lastAccess: "刚刚"
      };
      setAuthorizedUsers([...authorizedUsers, user]);
      setShowAddUserDialog(false);
      setNewUser({});
      toast({
        title: "用户已添加",
        description: "新用户已成功添加到系统。",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "添加用户失败",
        description: "添加用户时发生错误，请稍后重试。",
        variant: "destructive",
      });
    }
  };

  const handleSaveEditedUser = () => {
    if (editingUser) {
      try {
        setAuthorizedUsers(
          authorizedUsers.map((user) =>
            user.id === editingUser.id ? editingUser : user
          )
        );
        setShowEditUserDialog(false);
        setEditingUser(null);
        toast({
          title: "用户已更新",
          description: "用户信息已成功更新。",
        });
      } catch (error) {
        console.error("Error editing user:", error);
        toast({
          title: "编辑用户失败",
          description: "编辑用户时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  // 操作分组
  const handleGroupAction = (group: Group) => {
    setSelectedActionGroup(group);
    setShowGroupActionDialog(true);
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setShowEditGroupDialog(true);
    setShowGroupActionDialog(false);
  };

  const handleDeleteGroup = (group: Group) => {
    setGroupToDelete(group);
    setShowDeleteGroupDialog(true);
    setShowGroupActionDialog(false);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      try {
        // 检查是否有用户属于该分组
        const usersInGroup = authorizedUsers.filter(
          (user) => user.group === groupToDelete.id
        );
        if (usersInGroup.length > 0) {
          toast({
            title: "无法删除分组",
            description: `该分组中仍有 ${usersInGroup.length} 个用户，请先移除这些用户或将其分配到其他分组。`,
            variant: "destructive",
          });
          return;
        }

        setGroups(groups.filter((g) => g.id !== groupToDelete.id));
        setShowDeleteGroupDialog(false);
        setGroupToDelete(null);
        toast({
          title: "分组已删除",
          description: `分组 "${groupToDelete.name}" 已成功删除。`,
        });
      } catch (error) {
        console.error("Error deleting group:", error);
        toast({
          title: "删除分组失败",
          description: "删除分组时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddGroup = () => {
    if (!newGroup.name) {
      toast({
        title: "错误",
        description: "请填写分组名称。",
        variant: "destructive",
      });
      return;
    }
    try {
      const id = (groups.length + 1).toString();
      const group: Group = {
        ...(newGroup as Group),
        id,
        type: "user",
      };
      setGroups([...groups, group]);
      setShowAddGroupDialog(false);
      setNewGroup({});
      toast({
        title: "分组已添加",
        description: "新分组已成功添加到系统。",
      });
    } catch (error) {
      console.error("Error adding group:", error);
      toast({
        title: "添加分组失败",
        description: "添加分组时发生错误，请稍后重试。",
        variant: "destructive",
      });
    }
  };

  const handleSaveEditedGroup = () => {
    if (editingGroup) {
      try {
        setGroups(
          groups.map((group) =>
            group.id === editingGroup.id ? editingGroup : group
          )
        );
        setShowEditGroupDialog(false);
        setEditingGroup(null);
        toast({
          title: "分组已更新",
          description: "分组信息已成功更新。",
        });
      } catch (error) {
        console.error("Error editing group:", error);
        toast({
          title: "编辑分组失败",
          description: "编辑分组时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  // 保存个人信息
  const handleSaveProfile = () => {
    setIsEditing(false);
    toast({
      title: "个人信息已更新",
      description: "您的个人信息已成功更新。",
    });
  };

  return {
    // 状态
    activeTab,
    setActiveTab,
    tabs,
    searchText,
    setSearchText,
    showQRCode,
    setShowQRCode,
    isEditing,
    setIsEditing,
    selectedGroup,
    setSelectedGroup,
    groups,
    authorizedUsers,
    filteredUsers,
    editedUser,
    setEditedUser,
    scrollViewRef,

    // 模态框状态
    showAddUserDialog,
    setShowAddUserDialog,
    showAddGroupDialog,
    setShowAddGroupDialog,
    showEditUserDialog,
    setShowEditUserDialog,
    showEditGroupDialog,
    setShowEditGroupDialog,
    showDeleteUserDialog,
    setShowDeleteUserDialog,
    showDeleteGroupDialog,
    setShowDeleteGroupDialog,
    showUserActionDialog,
    setShowUserActionDialog,
    showGroupActionDialog,
    setShowGroupActionDialog,

    // 编辑状态
    newUser,
    setNewUser,
    newGroup,
    setNewGroup,
    editingUser,
    setEditingUser,
    editingGroup,
    setEditingGroup,
    userToDelete,
    groupToDelete,
    selectedActionUser,
    selectedActionGroup,

    // 方法
    handleScroll,
    handleUserAction,
    handleEditUser,
    handleDeleteUser,
    confirmDeleteUser,
    handleAddUser,
    handleSaveEditedUser,
    handleGroupAction,
    handleEditGroup,
    handleDeleteGroup,
    confirmDeleteGroup,
    handleAddGroup,
    handleSaveEditedGroup,
    handleSaveProfile,
  };
}
