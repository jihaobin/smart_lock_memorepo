import { useState, useRef } from "react";
import { ScrollView } from "react-native";
import { useToast } from "@/hooks/use-toast";
import type { Device, DeviceGroup } from "@/types/device-management";

export function useDeviceManagement() {
  const { toast } = useToast();
  const scrollViewRef = useRef<ScrollView>(null);

  // 状态变量
  const [searchText, setSearchText] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [deviceGroups, setDeviceGroups] = useState<DeviceGroup[]>([
    {
      id: "1",
      name: "家",
      devices: [
        { id: "1", name: "前门", status: "locked", batteryLevel: 85, isOnline: true },
        { id: "2", name: "后门", status: "unlocked", batteryLevel: 72, isOnline: true },
      ],
    },
    {
      id: "2",
      name: "办公室",
      devices: [{ id: "3", name: "办公室大门", status: "locked", batteryLevel: 64, isOnline: false }],
    },
  ]);

  // 模态框状态
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showEditDeviceDialog, setShowEditDeviceDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showDeleteDeviceDialog, setShowDeleteDeviceDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showDeviceActionDialog, setShowDeviceActionDialog] = useState(false);
  const [showGroupActionDialog, setShowGroupActionDialog] = useState(false);

  // 编辑状态
  const [newDevice, setNewDevice] = useState<{ name: string; groupId: string }>({ name: "", groupId: "" });
  const [newGroup, setNewGroup] = useState<{ name: string }>({ name: "" });
  const [editingDevice, setEditingDevice] = useState<{ id: string; name: string; groupId: string } | null>(null);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<{ id: string; name: string; groupId: string } | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<DeviceGroup | null>(null);
  const [selectedActionDevice, setSelectedActionDevice] = useState<{ id: string; name: string; groupId: string } | null>(null);
  const [selectedActionGroup, setSelectedActionGroup] = useState<DeviceGroup | null>(null);

  // 过滤设备组
  const filteredGroups = deviceGroups.filter((group) =>
    selectedGroup === null || selectedGroup === group.id
      ? group.devices.some((device) => device.name.toLowerCase().includes(searchText.toLowerCase()))
      : false
  );

  // 设备操作
  const handleDeviceAction = (groupId: string, device: { id: string; name: string }) => {
    setSelectedActionDevice({ ...device, groupId });
    setShowDeviceActionDialog(true);
  };

  // 分组操作
  const handleGroupAction = (group: DeviceGroup) => {
    setSelectedActionGroup(group);
    setShowGroupActionDialog(true);
  };

  // 添加分组
  const handleAddGroup = () => {
    if (newGroup.name.trim()) {
      try {
        const newGroupObj: DeviceGroup = {
          id: (deviceGroups.length + 1).toString(),
          name: newGroup.name.trim(),
          devices: [],
        };
        setDeviceGroups([...deviceGroups, newGroupObj]);
        setNewGroup({ name: "" });
        setShowAddGroupDialog(false);
        toast({
          title: "新分组已添加",
          description: `设备分组 "${newGroup.name}" 已成功创建。`,
        });
      } catch (error) {
        console.error("Error adding group:", error);
        toast({
          title: "添加分组失败",
          description: "添加分组时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  // 添加设备
  const handleAddDevice = () => {
    if (newDevice.name.trim() && newDevice.groupId) {
      try {
        const groupToUpdate = deviceGroups.find((group) => group.id === newDevice.groupId);
        if (groupToUpdate) {
          const updatedGroup = {
            ...groupToUpdate,
            devices: [
              ...groupToUpdate.devices,
              {
                id: (groupToUpdate.devices.length + 1).toString(),
                name: newDevice.name.trim(),
                status: "locked",
                batteryLevel: 100,
                isOnline: true,
              } as Device,
            ],
          };
          setDeviceGroups(deviceGroups.map((group) => (group.id === newDevice.groupId ? updatedGroup : group)) as DeviceGroup[]);
          setNewDevice({ name: "", groupId: "" });
          setShowAddDeviceDialog(false);
          toast({
            title: "新设备已添加",
            description: `设备 "${newDevice.name}" 已成功添加到分组。`,
          });
        }
      } catch (error) {
        console.error("Error adding device:", error);
        toast({
          title: "添加设备失败",
          description: "添加设备时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  // 删除分组
  const handleDeleteGroup = (group: DeviceGroup) => {
    setGroupToDelete(group);
    setShowDeleteGroupDialog(true);
  };

  const confirmDeleteGroup = () => {
    if (groupToDelete) {
      try {
        const updatedGroups = deviceGroups.filter((group) => group.id !== groupToDelete.id);
        setDeviceGroups(updatedGroups);
        if (selectedGroup === groupToDelete.id) {
          setSelectedGroup(null);
        }
        setShowDeleteGroupDialog(false);
        setGroupToDelete(null);
        toast({
          title: "分组已删除",
          description: `设备分组 "${groupToDelete.name}" 及其设备已成功删除。`,
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

  // 删除设备
  const handleDeleteDevice = (groupId: string, device: { id: string; name: string }) => {
    setDeviceToDelete({ ...device, groupId });
    setShowDeleteDeviceDialog(true);
  };

  const confirmDeleteDevice = () => {
    if (deviceToDelete) {
      try {
        const updatedGroups = deviceGroups.map((group) => {
          if (group.id === deviceToDelete.groupId) {
            return {
              ...group,
              devices: group.devices.filter((device) => device.id !== deviceToDelete.id),
            };
          }
          return group;
        });
        setDeviceGroups(updatedGroups);
        setShowDeleteDeviceDialog(false);
        setDeviceToDelete(null);
        toast({
          title: "设备已删除",
          description: `设备 "${deviceToDelete.name}" 已成功从分组中移除。`,
        });
      } catch (error) {
        console.error("Error deleting device:", error);
        toast({
          title: "删除设备失败",
          description: "删除设备时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  // 编辑设备
  const handleEditDevice = (groupId: string, device: { id: string; name: string }) => {
    setEditingDevice({ ...device, groupId });
    setShowEditDeviceDialog(true);
  };

  const handleSaveEditedDevice = () => {
    if (editingDevice) {
      try {
        const updatedGroups = deviceGroups.map((group) => {
          if (group.id === editingDevice.groupId) {
            return {
              ...group,
              devices: group.devices.map((device) =>
                device.id === editingDevice.id ? { ...device, name: editingDevice.name } : device
              ),
            };
          }
          return group;
        });
        setDeviceGroups(updatedGroups);
        setShowEditDeviceDialog(false);
        setEditingDevice(null);
        toast({
          title: "设备已更新",
          description: "设备信息已成功更新。",
        });
      } catch (error) {
        console.error("Error editing device:", error);
        toast({
          title: "编辑设备失败",
          description: "编辑设备时发生错误，请稍后重试。",
          variant: "destructive",
        });
      }
    }
  };

  // 编辑分组
  const handleEditGroup = (group: DeviceGroup) => {
    setEditingGroup(group);
    setShowEditGroupDialog(true);
  };

  const handleSaveEditedGroup = () => {
    if (editingGroup) {
      try {
        const updatedGroups = deviceGroups.map((group) => (group.id === editingGroup.id ? editingGroup : group));
        setDeviceGroups(updatedGroups);
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

  return {
    // 状态
    searchText,
    setSearchText,
    selectedGroup,
    setSelectedGroup,
    deviceGroups,
    filteredGroups,
    scrollViewRef,

    // 模态框状态
    showAddDeviceDialog,
    setShowAddDeviceDialog,
    showAddGroupDialog,
    setShowAddGroupDialog,
    showEditDeviceDialog,
    setShowEditDeviceDialog,
    showEditGroupDialog,
    setShowEditGroupDialog,
    showDeleteDeviceDialog,
    setShowDeleteDeviceDialog,
    showDeleteGroupDialog,
    setShowDeleteGroupDialog,
    showDeviceActionDialog,
    setShowDeviceActionDialog,
    showGroupActionDialog,
    setShowGroupActionDialog,

    // 编辑状态
    newDevice,
    setNewDevice,
    newGroup,
    setNewGroup,
    editingDevice,
    setEditingDevice,
    editingGroup,
    setEditingGroup,
    deviceToDelete,
    groupToDelete,
    selectedActionDevice,
    selectedActionGroup,

    // 方法
    handleDeviceAction,
    handleGroupAction,
    handleAddGroup,
    handleAddDevice,
    handleDeleteGroup,
    confirmDeleteGroup,
    handleDeleteDevice,
    confirmDeleteDevice,
    handleEditDevice,
    handleSaveEditedDevice,
    handleEditGroup,
    handleSaveEditedGroup,
  };
}
