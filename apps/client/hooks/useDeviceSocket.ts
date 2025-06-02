import { DeviceStatus as DeviceStatusShare } from '@smart-lock/shared';
import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { useToast } from './use-toast';
import { useDevices } from './useDevices';

import { useAuth } from '@/contexts/auth-context';

// 开锁结果类型
interface UnlockResult {
  deviceId: string;
  success: boolean;
  message: string;
  timestamp: Date;
}

type DeviceStatus = DeviceStatusShare & {
  image: Base64URLString;
};

export function useDeviceSocket() {
  const user = useAuth();
  const { getDeviceNameById } = useDevices();
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceStatus>>({});
  const deviceSocketRef = useRef<Socket | null>(null);
  const mobileSocketRef = useRef<Socket | null>(null);

  const [isDeviceSocketConnected, setIsDeviceSocketConnected] = useState(false);
  const [isMobileSocketConnected, setIsMobileSocketConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(user.user?.id || null);

  // 新增：存储最近的开锁结果
  const [unlockResults, setUnlockResults] = useState<UnlockResult[]>([]);
  // 新增：当前处理中的开锁请求
  const [pendingUnlocks, setPendingUnlocks] = useState<Record<string, boolean>>({});

  const { toast } = useToast();

  // 如果没有提供userId，尝试从存储中获取
  useEffect(() => {
    if (user.user?.id) {
      setCurrentUserId(user.user?.id);
      return;
    }
  }, [user.user?.id]);

  // 连接设备状态WebSocket(设备上线和离线)
  useEffect(() => {
    if (deviceSocketRef.current) return;

    // WebSocket服务器地址，实际部署时应从环境变量获取
    const socketUrl = process.env.EXPO_PUBLIC_NOTICATION || 'http://localhost:3001';

    try {
      const deviceSocket = io(`${socketUrl}/devices`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { isMobile: 1, userId: currentUserId },
      });

      deviceSocket.on('connect', () => {
        console.log('设备WebSocket已连接');
        setIsDeviceSocketConnected(true);
      });

      deviceSocket.on(
        'deviceStatusChanged',
        (data: { deviceId: string; isOnline: boolean; timestamp: Date }) => {
          console.log(`设备 ${data.deviceId} 状态变更为 ${data.isOnline ? '在线' : '离线'}`);
          setDeviceStatuses(prev => ({
            ...prev,
            [data.deviceId]: {
              ...prev[data.deviceId],
              isOnline: data.isOnline,
            },
          }));
        }
      );

      // 添加监听设备锁开启/关闭变更事件
      deviceSocket.on(
        'deviceLockStatusChanged',
        (data: { deviceId: string; lockStatus: boolean; timestamp: Date }) => {
          console.log(`设备 ${data.deviceId} 锁状态变更为 ${data.lockStatus}`);
          setDeviceStatuses(prev => ({
            ...prev,
            [data.deviceId]: {
              ...prev[data.deviceId],
              isOpen: data.lockStatus,
            },
          }));
        }
      );

      // 监听设备电池电量变更的事件
      deviceSocket.on(
        'deviceBatteryLevelChanged',
        (data: { deviceId: string; batteryLevel: number; timestamp: Date }) => {
          console.log(`设备 ${data.deviceId} 电量变更为 ${data.batteryLevel}`);
          setDeviceStatuses(prev => ({
            ...prev,
            [data.deviceId]: {
              ...prev[data.deviceId],
              batteryLevel: data.batteryLevel,
            },
          }));
        }
      );

      // 监控设备摄像头发送的图片
      deviceSocket.on('sendDeviceImage', (data: { deviceId: string; image: Base64URLString }) => {
        setDeviceStatuses(prev => ({
          ...prev,
          [data.deviceId]: {
            ...prev[data.deviceId],
            image: data.image,
          },
        }));
      });

      deviceSocket.on('connect_error', error => {
        console.error('设备WebSocket连接错误:', error);
      });

      deviceSocket.on('disconnect', () => {
        console.log('设备WebSocket已断开');
        setIsDeviceSocketConnected(false);
      });

      // 初始化时，服务器会主动推送用户所有设备的状态信息
      deviceSocket.on(
        'getUserDevicesStatus',
        (_devices: { success: boolean; data: Record<string, DeviceStatus> }) => {
          if (_devices.success) {
            setDeviceStatuses(prev => ({
              ...prev,
              // 合并设备状态信息
              ..._devices.data,
            }));
          } else {
            console.error('获取设备状态失败');
          }
        }
      );

      deviceSocketRef.current = deviceSocket;
    } catch (error) {
      console.error('初始化设备WebSocket失败:', error);
    }

    return () => {
      if (deviceSocketRef.current) {
        deviceSocketRef.current.disconnect();
        deviceSocketRef.current = null;
      }
    };
  }, [toast]);

  // 连接移动端WebSocket（接收开锁结果通知）
  useEffect(() => {
    // 如果没有用户ID或者已经有连接，则退出
    if (!currentUserId || mobileSocketRef.current) return;

    const socketUrl = process.env.EXPO_PUBLIC_NOTICATION || 'http://localhost:3001';

    try {
      // 连接到mobile命名空间，并传递用户ID
      const mobileSocket = io(`${socketUrl}/mobile`, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        auth: { userId: currentUserId },
      });

      mobileSocket.on('connect', () => {
        console.log('移动端WebSocket已连接，用户ID:', currentUserId);
        setIsMobileSocketConnected(true);
      });

      // 监听开锁结果事件
      mobileSocket.on('unlockResult', (data: UnlockResult) => {
        console.log(`收到设备 ${data.deviceId} 的开锁结果:`, data);

        // 更新开锁结果列表
        setUnlockResults(prev => [data, ...prev].slice(0, 10)); // 只保留最近10条

        // 更新设备的解锁状态
        setPendingUnlocks(prev => ({ ...prev, [data.deviceId]: false }));

        // 显示开锁结果通知
        toast({
          title: `${getDeviceNameById(data.deviceId)}${data.success ? '开锁成功' : '开锁失败'}`,
          description: data.message,
          variant: data.success ? 'default' : 'destructive',
        });
      });

      mobileSocket.on('connect_error', error => {
        console.error('移动端WebSocket连接错误:', JSON.stringify(error));
      });

      mobileSocket.on('disconnect', () => {
        console.log('移动端WebSocket已断开');
        setIsMobileSocketConnected(false);
      });

      mobileSocketRef.current = mobileSocket;
    } catch (error) {
      console.error('初始化移动端WebSocket失败:', error);
    }

    return () => {
      if (mobileSocketRef.current) {
        mobileSocketRef.current.disconnect();
        mobileSocketRef.current = null;
      }
    };
  }, [currentUserId, toast]);

  // 检查设备是否在线
  const isDeviceOnline = useCallback(
    (deviceId: string) => {
      return deviceStatuses[deviceId]?.isOnline || false;
    },
    [deviceStatuses]
  );

  // 获取所有设备的在线状态
  const getDeviceStatuses = useCallback(() => {
    return deviceStatuses;
  }, [deviceStatuses]);

  // 新增：标记设备正在解锁中
  const markDeviceUnlocking = useCallback((deviceId: string) => {
    setPendingUnlocks(prev => ({ ...prev, [deviceId]: true }));
  }, []);

  // 新增：检查设备是否正在解锁中
  const isDeviceUnlocking = useCallback(
    (deviceId: string) => {
      return pendingUnlocks[deviceId] || false;
    },
    [pendingUnlocks]
  );

  // 新增：获取特定设备的最新解锁结果
  const getLatestUnlockResult = useCallback(
    (deviceId: string) => {
      return unlockResults.find(result => result.deviceId === deviceId);
    },
    [unlockResults]
  );

  // 新增：清除特定设备的开锁结果
  const clearUnlockResult = useCallback((deviceId: string) => {
    setUnlockResults(prev => prev.filter(result => result.deviceId !== deviceId));
  }, []);

  // 获取设备锁状态
  const getDeviceLockStatus = useCallback(
    (deviceId: string) => {
      return deviceStatuses[deviceId];
    },
    [deviceStatuses]
  );

  return {
    isDeviceOnline,
    deviceStatuses: getDeviceStatuses(),
    isConnected: isDeviceSocketConnected && (!currentUserId || isMobileSocketConnected),
    isDeviceSocketConnected,
    isMobileSocketConnected,
    // 新增的功能
    unlockResults,
    isDeviceUnlocking,
    markDeviceUnlocking,
    getLatestUnlockResult,
    clearUnlockResult,
    getDeviceLockStatus,
    deviceSocket: deviceSocketRef.current,
    mobileSocket: mobileSocketRef.current,
    userId: currentUserId,
  };
}
