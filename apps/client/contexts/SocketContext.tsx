import { IAppNotificationMessage, SOCKET_JOIN_ROOM_KEY, SOCKET_NOTIFICATION_KEY } from '@smart-lock/shared/shared';
import * as Notifications from 'expo-notifications';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { io, Socket } from 'socket.io-client';

import { useAuth } from './AuthContext';

import { useToast } from '@/hooks/use-toast';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children}: { children: React.ReactNode}) {
  const socketRef = useRef<Socket | null>(null);
  const {toast} = useToast();
  const {user} = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const responseListener = useRef<Notifications.EventSubscription>();
  const appState = useRef(AppState.currentState);
  const isConnecting = useRef(false);

  // 使用useCallback优化sendNotification函数，避免不必要的重新创建
  const sendNotification = useCallback(async (title: string, body: string, data = {}) => {
    try {
      // 检查应用状态，决定通知行为
      const currentAppState = AppState.currentState;

      // 创建通知内容
      const notificationContent = {
        title,
        body,
        data: { ...data, timestamp: new Date().getTime() },
      };

      // 前台应用时使用toast
      if (currentAppState === 'active') {
        toast({
          title,
          description: body,
          variant: "info"
        });
      }

      // 发送系统通知 - 立即显示，不使用触发器
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // 立即显示通知
      });
    } catch (error) {
      console.error('发送通知失败:', error);
    }
  }, [toast]);

  // 处理通知响应
  useEffect(() => {
    // 监听通知响应
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const { data } = response.notification.request.content;
      // 处理用户点击通知的逻辑
      console.error('用户点击了通知:', data);
      // 这里可以添加导航或其他处理逻辑
    });

    // 应用状态变化监听
    const subscription = AppState.addEventListener('change', nextAppState => {
      appState.current = nextAppState;
    });

    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
    };
  }, []);

  // 连接WebSocket
  useEffect(() => {
    // 防止重复连接
    if (isConnecting.current) return;

    // 确保只在用户登录后才连接
    if (!user?.id) return;

    const connectSocket = async () => {
      try {
        isConnecting.current = true;

        // 如果已有连接，先断开
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        // 显式指定完整的 WebSocket URL
        const socketUrl = process.env.EXPO_PUBLIC_NOTICATION || "http://localhost:3001";
        // eslint-disable-next-line no-console
        console.log('尝试连接到 WebSocket 服务器:', socketUrl);

        socketRef.current = io(socketUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        // 连接事件
        socketRef.current.on('connect', () => {
          // eslint-disable-next-line no-console
          console.log('WebSocket 连接成功');
          setIsConnected(true);
          toast({
              title: '连接成功',
              variant: "info"
          });
          // 确保用户ID存在再加入房间
          if (user?.id) {
              // eslint-disable-next-line no-console
              console.log('加入房间:', user.id);
              socketRef.current?.emit(SOCKET_JOIN_ROOM_KEY, user.id);
          }
        });

        // 连接错误处理
        socketRef.current.on('connect_error', (error) => {
            console.error('WebSocket 连接错误:', error);
            toast({
                title: '连接失败',
                description: `无法连接到服务器: ${error.message}`,
                variant: "destructive"
            });
        });

        // 其他事件监听保持不变
        socketRef.current.on(SOCKET_JOIN_ROOM_KEY, (message) => {
            // eslint-disable-next-line no-console
            console.log('message', message);
            toast({
              title: '收到消息',
              description: JSON.stringify(message),
              variant: "info"
            })
        });

        // 监听消息事件
        socketRef.current.on(SOCKET_NOTIFICATION_KEY, (message: IAppNotificationMessage) => {
            // eslint-disable-next-line no-console
            console.log('收到通知消息:', message);

            // 发送通知
            sendNotification("新消息", message.message, { data: message });
        });

        // 断开连接事件
        socketRef.current.on('disconnect', (reason) => {
          // eslint-disable-next-line no-console
          console.log('WebSocket 断开连接:', reason);
          setIsConnected(false);
          isConnecting.current = false;
        });

      } catch(e) {
        // eslint-disable-next-line no-console
        console.log('error', e);
        toast({
          title: '连接错误',
          description: String(e),
          variant: "destructive"
        });
        isConnecting.current = false;
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        // eslint-disable-next-line no-console
        console.log('断开 WebSocket 连接');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isConnecting.current = false;
    };
  }, [user?.id, toast, sendNotification]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
