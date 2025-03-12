import { Injectable } from '@nestjs/common';
import { Lock } from '@smart-lock/shared';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getLocks(): Lock[] {
    // 模拟数据
    return [
      {
        id: '1',
        name: '前门',
        status: 'locked',
        batteryLevel: 85,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        name: '后门',
        status: 'unlocked',
        batteryLevel: 72,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '3',
        name: '车库门',
        status: 'locked',
        batteryLevel: 95,
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}
