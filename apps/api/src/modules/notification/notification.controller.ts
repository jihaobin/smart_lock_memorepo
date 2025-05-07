import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import {
  CreateNotificationSchema,
  GetNotificationsSchema,
} from '@smart-lock/shared';
import { Request } from 'express';
import { ZodValidationPipe } from 'src/common';
import { Public } from 'src/common/auth/jwt-auth.guard';
import { ZodBody } from 'src/common/decorators';

import {
  CreateNotificationDto,
  GetNotificationsDto,
} from './dto/notification.dto';
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
    return this.notificationService.createAndSendNotification(
      createNotificationDto,
    );
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
   * 获取用户通知列表
   */
  @Get()
  @UsePipes(new ZodValidationPipe(GetNotificationsSchema))
  async getUserNotifications(
    @Query() query: GetNotificationsDto,
    @Req() request: Request,
  ) {
    const userId = request.user.userId;
    return this.notificationService.getUserNotifications({
      userId,
      page: query.page ?? '1',
      limit: query.limit ?? '10',
      ...query,
    });
  }
}
