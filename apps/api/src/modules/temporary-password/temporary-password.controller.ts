import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { TemporaryPasswordService } from './temporary-password.service';
import {
  CreateTemporaryPasswordDto,
  QueryTemporaryPasswordDto,
  BatchDeleteTemporaryPasswordDto,
  ValidateTemporaryPasswordDto,
  CreateTemporaryPasswordSchema,
} from './dto';
import { TemporaryPasswordInfo } from '@smart-lock/shared';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ZodBody } from 'src/common';
import { Request } from 'express';

@ApiTags('临时密码管理')
@ApiBearerAuth()
@Controller('temporary-password')
export class TemporaryPasswordController {
  constructor(
    private readonly temporaryPasswordService: TemporaryPasswordService,
  ) {}
  @ZodBody(CreateTemporaryPasswordSchema)
  @Post()
  @ApiOperation({ summary: '创建临时密码' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 404, description: '设备不存在' })
  async create(
    @Req() req: Request,
    @Body() createTemporaryPasswordDto: CreateTemporaryPasswordDto,
  ): Promise<TemporaryPasswordInfo> {
    const userId = req.user.userId;
    return this.temporaryPasswordService.create(
      userId,
      createTemporaryPasswordDto,
    );
  }

  @Get()
  @ApiOperation({ summary: '分页查询临时密码' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() queryDto: QueryTemporaryPasswordDto) {
    return this.temporaryPasswordService.findMany(queryDto);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取临时密码统计信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics(@Query('deviceId') deviceId?: string) {
    return this.temporaryPasswordService.getStatistics(deviceId);
  }

  @Get('device/:deviceId')
  @ApiOperation({ summary: '根据设备ID查询有效临时密码' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findValidByDeviceId(
    @Param('deviceId') deviceId: string,
  ): Promise<TemporaryPasswordInfo[]> {
    return this.temporaryPasswordService.findValidByDeviceId(deviceId);
  }

  @Get('creator/:creatorId')
  @ApiOperation({ summary: '根据创建者ID查询临时密码' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findByCreatorId(
    @Param('creatorId') creatorId: string,
  ): Promise<TemporaryPasswordInfo[]> {
    return this.temporaryPasswordService.findByCreatorId(creatorId);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据ID查询临时密码详情' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '临时密码不存在' })
  async findOne(@Param('id') id: string): Promise<TemporaryPasswordInfo> {
    const result = await this.temporaryPasswordService.findById(id);
    if (!result) {
      throw new BadRequestException('临时密码不存在');
    }
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除临时密码' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.temporaryPasswordService.remove(id);
    return { success };
  }

  @Delete()
  @ApiOperation({ summary: '批量删除临时密码' })
  @ApiResponse({ status: 200, description: '批量删除成功' })
  async batchRemove(
    @Body() batchDeleteDto: BatchDeleteTemporaryPasswordDto,
  ): Promise<{ deletedCount: number }> {
    const deletedCount =
      await this.temporaryPasswordService.batchRemove(batchDeleteDto);
    return { deletedCount };
  }

  @Post('validate')
  @ApiOperation({ summary: '验证临时密码' })
  @ApiResponse({ status: 200, description: '验证完成' })
  async validatePassword(
    @Body() validateDto: ValidateTemporaryPasswordDto,
  ): Promise<{
    valid: boolean;
    passwordInfo?: TemporaryPasswordInfo;
    reason?: string;
  }> {
    return this.temporaryPasswordService.validatePassword(validateDto);
  }
}
