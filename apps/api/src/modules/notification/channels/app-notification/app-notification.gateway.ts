import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  IAppNotificationMessage,
  SOCKET_JOIN_ROOM_KEY,
  SOCKET_NOTIFICATION_KEY,
} from '@smart-lock/shared';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3001, {
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'notification',
})
export class AppNotificationGateway {
  @WebSocketServer()
  private server: Server;

  @SubscribeMessage(SOCKET_JOIN_ROOM_KEY)
  create(@MessageBody() roomName: string, @ConnectedSocket() client: Socket) {
    client.join(roomName);

    // 使用 this.server.to() 向整个房间发送消息，包括发送者
    this.server.to(roomName).emit(SOCKET_JOIN_ROOM_KEY, roomName);
    return roomName;
  }

  sendNotification(roomId: string, message: IAppNotificationMessage) {
    this.server.to(roomId).emit(SOCKET_NOTIFICATION_KEY, message);
  }
}
