import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/common/auth/jwt-auth.guard';
import { ZodBody } from 'src/common/decorators';
import { ZodValidationPipe } from 'src/common/pipes';

import { CreateNotificationSchema, CreateNotificationDto, GetNotificationsSchema, GetNotificationsDto } from './dto/notification.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 创建并发送通知
   */
  @Public()
  @Post()
  @ZodBody(CreateNotificationSchema)
  async createAndSendNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationService.createAndSendNotification(createNotificationDto);
  }

  /**
   * 获取通知状态
   */
  @Public()
  @Get(':id/status')
  async getNotificationStatus(@Param('id') id: string) {
    return this.notificationService.getNotificationStatus(id);
  }

  /**
   * 获取通知列表
   * 注意：此为示例API，实际功能需要在NotificationService中实现
   */
  @Public()
  @Get()
  async getNotifications(
    @Query(new ZodValidationPipe(GetNotificationsSchema))
    queryParams: GetNotificationsDto,
  ) {
    // 示例返回
    return {
      items: [],
      total: 0,
      page: queryParams.page,
      limit: queryParams.limit,
    };
  }
}