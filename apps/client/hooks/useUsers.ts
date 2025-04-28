import { useMemo } from 'react';

import { useUserManagementApi } from './api/useUserManagementApi';
import { useToast } from './use-toast';

import type { AuthorizedUser } from '@/types/user-management';

/**
 * 用户管理钩子 - 专注于用户数据的管理
 * 包含用户列表查询、过滤、CRUD 操作等功能
 */
export function useUsers() {
  const { toast } = useToast();

  // 获取API钩子
  const {
    useUsers: useUsersQuery,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useUpdateUserNFC,
    useUpdateUserFingerprint,
    useUpdateUserFace,
    useUpdateUserEyes,
    useUpdateUserDevices,
    useUpdateUserLockPassword,
  } = useUserManagementApi();

  // 用户数据查询
  const { data: users = [], isLoading, isError, error, refetch } = useUsersQuery();

  // 变更操作
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const updateNFCMutation = useUpdateUserNFC();
  const updateFingerprintMutation = useUpdateUserFingerprint();
  const updateFaceMutation = useUpdateUserFace();
  const updateEyesMutation = useUpdateUserEyes();
  const updateDevicesMutation = useUpdateUserDevices();
  const updateLockPasswordMutation = useUpdateUserLockPassword();

  /**
   * 过滤用户列表
   */
  const filterUsers = (searchText: string, selectedGroup: string | null) => {
    return users
      .filter(user => searchText === '' || user.remarkName.includes(searchText))
      .filter(user => selectedGroup === null || user.friendGroupId === selectedGroup);
  };

  /**
   * 创建新用户
   */
  const createUser = async (userData: AuthorizedUser) => {
    try {
      const result = await createUserMutation.mutateAsync(userData);
      toast({
        title: '用户已创建',
        description: `用户 "${result.remarkName}" 已成功创建。`,
      });
      return result;
    } catch (error) {
      console.error('创建用户失败:', error);
      toast({
        title: '创建用户失败',
        description: '创建用户时发生错误，请稍后重试。',
      });
      throw error;
    }
  };

  /**
   * 更新用户信息
   */
  const updateUser = async (id: string, userData: Partial<AuthorizedUser>) => {
    try {
      const result = await updateUserMutation.mutateAsync({ id, userData });
      toast({
        title: '用户已更新',
        description: `用户 "${result.remarkName}" 的信息已成功更新。`,
      });
      return result;
    } catch (error) {
      console.error('更新用户失败:', error);
      toast({
        title: '更新用户失败',
        description: '更新用户信息时发生错误，请稍后重试。',
      });
      throw error;
    }
  };

  /**
   * 删除用户
   */
  const deleteUser = async (id: string, userName: string) => {
    try {
      await deleteUserMutation.mutateAsync(id);
      toast({
        title: '用户已删除',
        description: `用户 "${userName}" 已成功删除。`,
      });
    } catch (error) {
      console.error('删除用户失败:', error);
      toast({
        title: '删除用户失败',
        description: '删除用户时发生错误，请稍后重试。',
      });
      throw error;
    }
  };

  // 封装所有认证方法
  const authMethods = {
    updateNFC: async (userId: string, nfcData: string[]) => {
      try {
        return await updateNFCMutation.mutateAsync({ userId, nfcData });
      } catch (error) {
        console.error('更新NFC数据失败:', error);
        toast({
          title: '更新NFC数据失败',
          description: '更新用户NFC数据时发生错误，请稍后重试。',
        });
        throw error;
      }
    },

    updateFingerprint: async (userId: string, fingerprintData: string[]) => {
      try {
        return await updateFingerprintMutation.mutateAsync({ userId, fingerprintData });
      } catch (error) {
        console.error('更新指纹数据失败:', error);
        toast({
          title: '更新指纹数据失败',
          description: '更新用户指纹数据时发生错误，请稍后重试。',
        });
        throw error;
      }
    },

    updateFace: async (userId: string, faceData: string) => {
      try {
        return await updateFaceMutation.mutateAsync({ userId, faceData });
      } catch (error) {
        console.error('更新人脸数据失败:', error);
        toast({
          title: '更新人脸数据失败',
          description: '更新用户人脸数据时发生错误，请稍后重试。',
        });
        throw error;
      }
    },

    updateEyes: async (userId: string, eyesData: string[]) => {
      try {
        return await updateEyesMutation.mutateAsync({ userId, eyesData });
      } catch (error) {
        console.error('更新虹膜数据失败:', error);
        toast({
          title: '更新虹膜数据失败',
          description: '更新用户虹膜数据时发生错误，请稍后重试。',
        });
        throw error;
      }
    },

    updateDevices: async (userId: string, devices: string[]) => {
      try {
        return await updateDevicesMutation.mutateAsync({ userId, devices });
      } catch (error) {
        console.error('更新设备数据失败:', error);
        toast({
          title: '更新设备数据失败',
          description: '更新用户设备数据时发生错误，请稍后重试。',
        });
        throw error;
      }
    },

    updateLockPassword: async (userId: string, password: string) => {
      try {
        return await updateLockPasswordMutation.mutateAsync({ userId, password });
      } catch (error) {
        console.error('更新锁密码失败:', error);
        toast({
          title: '更新锁密码失败',
          description: '更新用户锁密码时发生错误，请稍后重试。',
        });
        throw error;
      }
    },
  };

  // 加载和错误状态
  const status = useMemo(
    () => ({
      isLoading,
      isError,
      error,
      isMutating:
        createUserMutation.isPending ||
        updateUserMutation.isPending ||
        deleteUserMutation.isPending ||
        updateNFCMutation.isPending ||
        updateFingerprintMutation.isPending ||
        updateFaceMutation.isPending ||
        updateEyesMutation.isPending ||
        updateDevicesMutation.isPending ||
        updateLockPasswordMutation.isPending,
    }),
    [
      isLoading,
      isError,
      error,
      createUserMutation.isPending,
      updateUserMutation.isPending,
      deleteUserMutation.isPending,
      updateNFCMutation.isPending,
      updateFingerprintMutation.isPending,
      updateFaceMutation.isPending,
      updateEyesMutation.isPending,
      updateDevicesMutation.isPending,
      updateLockPasswordMutation.isPending,
    ]
  );

  return {
    // 数据
    users,

    // 方法
    filterUsers,
    createUser,
    updateUser,
    deleteUser,

    // 认证方法
    auth: authMethods,

    // 状态
    status,

    // 刷新
    refetch,
  };
}
