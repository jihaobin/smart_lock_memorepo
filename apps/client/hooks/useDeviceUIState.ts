import { useState, useRef } from 'react';
import { ScrollView } from 'react-native';

import type { DeviceGroup, DeviceViewModel, Tab } from '@/types/device-management';

/**
 * 设备UI状态管理钩子
 * 管理设备管理界面的UI状态
 */
export function useDeviceUIState() {
  const scrollViewRef = useRef<ScrollView>(null);

  // Tab相关状态 - 供未来扩展使用
  const [activeTab, setActiveTab] = useState(0);
  const tabs: Tab[] = [
    { key: 'devices', title: '设备列表' },
    // 可以在未来扩展更多的标签页
  ];

  // 筛选和搜索状态
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  // 设备相关模态框状态
  const [showAddDeviceDialog, setShowAddDeviceDialog] = useState(false);
  const [showEditDeviceDialog, setShowEditDeviceDialog] = useState(false);
  const [showDeleteDeviceDialog, setShowDeleteDeviceDialog] = useState(false);
  const [showDeviceActionDialog, setShowDeviceActionDialog] = useState(false);

  // 编辑设备状态
  const [newDevice, setNewDevice] = useState<{ deviceId?: string }>({});
  const [editingDevice, setEditingDevice] = useState<DeviceViewModel | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceViewModel | null>(null);
  const [selectedActionDevice, setSelectedActionDevice] = useState<DeviceViewModel | null>(null);

  // 设备组相关模态框状态
  const [showAddGroupDialog, setShowAddGroupDialog] = useState(false);
  const [showEditGroupDialog, setShowEditGroupDialog] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [showGroupActionDialog, setShowGroupActionDialog] = useState(false);

  // 编辑设备组状态
  const [newGroup, setNewGroup] = useState<Partial<DeviceGroup>>({});
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<DeviceGroup | null>(null);
  const [selectedActionGroup, setSelectedActionGroup] = useState<DeviceGroup | null>(null);

  // 设备动作处理
  const deviceActions = {
    handleAction: (device: DeviceViewModel) => {
      setSelectedActionDevice(device);
      setShowDeviceActionDialog(true);
    },

    handleEdit: (device: DeviceViewModel) => {
      setEditingDevice(device);
      setShowEditDeviceDialog(true);
      setShowDeviceActionDialog(false);
    },

    handleDelete: (device: DeviceViewModel) => {
      setDeviceToDelete(device);
      setShowDeleteDeviceDialog(true);
      setShowDeviceActionDialog(false);
    },

    clearModal: () => {
      setShowAddDeviceDialog(false);
      setShowEditDeviceDialog(false);
      setShowDeleteDeviceDialog(false);
      setShowDeviceActionDialog(false);
      setDeviceToDelete(null);
      setSelectedActionDevice(null);
      setEditingDevice(null);
      setNewDevice({});
    },
  };

  // 设备组动作处理
  const groupActions = {
    handleAction: (group: DeviceGroup) => {
      setSelectedActionGroup(group);
      setShowGroupActionDialog(true);
    },

    handleEdit: (group: DeviceGroup) => {
      setEditingGroup(group);
      setShowEditGroupDialog(true);
      setShowGroupActionDialog(false);
    },

    handleDelete: (group: DeviceGroup) => {
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
    showQRCode,
    setShowQRCode,

    // 设备模态框状态
    showAddDeviceDialog,
    setShowAddDeviceDialog,
    showEditDeviceDialog,
    setShowEditDeviceDialog,
    showDeleteDeviceDialog,
    setShowDeleteDeviceDialog,
    showDeviceActionDialog,
    setShowDeviceActionDialog,

    // 设备编辑状态
    newDevice,
    setNewDevice,
    editingDevice,
    setEditingDevice,
    deviceToDelete,
    setDeviceToDelete,
    selectedActionDevice,
    setSelectedActionDevice,

    // 设备组模态框状态
    showAddGroupDialog,
    setShowAddGroupDialog,
    showEditGroupDialog,
    setShowEditGroupDialog,
    showDeleteGroupDialog,
    setShowDeleteGroupDialog,
    showGroupActionDialog,
    setShowGroupActionDialog,

    // 设备组编辑状态
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
    deviceActions,
    groupActions,
  };
}
