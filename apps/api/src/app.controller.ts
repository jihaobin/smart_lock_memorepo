import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiResponse, Lock, formatDate } from '@smart-lock/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): ApiResponse<string> {
    return {
      success: true,
      data: this.appService.getHello(),
      message: 'Hello message retrieved successfully',
    };
  }

  @Get('locks')
  getLocks(): ApiResponse<Lock[]> {
    const locks = this.appService.getLocks();
    return {
      success: true,
      data: locks,
      message: `Retrieved ${locks.length} locks`,
    };
  }

  @Post('format-date')
  formatDate(@Body() body: { date: string }): ApiResponse<string> {
    try {
      const date = new Date(body.date);
      const formattedDate = formatDate(date);
      return {
        success: true,
        data: formattedDate,
        message: 'Date formatted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid date format',
      };
    }
  }
}
