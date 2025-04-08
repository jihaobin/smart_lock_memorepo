import { SOCKET_JOIN_ROOM_KEY, SOCKET_NOTIFICATION_KEY } from '@smart-lock/shared/shared';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import { useToast } from './use-toast';

import { useAuth } from '@/contexts/AuthContext';

export default function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {user} = useAuth();
  const {toast} = useToast();

  useEffect(() => {
    // 初始化连接
    socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001", {
      transports: ['websocket'],
    });

    // 连接事件
    socketRef.current.on('connect', () => {
        socketRef.current?.emit(SOCKET_JOIN_ROOM_KEY, user?.id);
    });

    socketRef.current.on(SOCKET_JOIN_ROOM_KEY, (message) => {
      console.log('message', message);
      toast({
        title: '收到消息',
        description: message,
        variant: "info"
      })
    });

    // 监听消息事件
    socketRef.current.on(SOCKET_NOTIFICATION_KEY, (message: string) => {
      console.log('message', message);
      toast({
        title: '收到消息',
        description: JSON.stringify(message),
        variant: "info"
      })
    });

    // 断开连接清理
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return {
    socket: socketRef.current,
  };
}