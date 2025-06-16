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
import { TemporaryPasswordInfo } from '@smart-lock/shared';
import { Request } from 'express';
import { ZodBody, ZodValidationPipe } from 'src/common';

import {
  CreateTemporaryPasswordDto,
  QueryTemporaryPasswordDto,
  BatchDeleteTemporaryPasswordDto,
  ValidateTemporaryPasswordDto,
  CreateTemporaryPasswordSchema,
  QueryTemporaryPasswordSchema,
} from './dto';
import { TemporaryPasswordService } from './temporary-password.service';

@Controller('temporary-password')
export class TemporaryPasswordController {
  constructor(
    private readonly temporaryPasswordService: TemporaryPasswordService,
  ) {}
  @ZodBody(CreateTemporaryPasswordSchema)
  @Post()
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
  async findAll(
    @Query(new ZodValidationPipe(QueryTemporaryPasswordSchema))
    queryDto: QueryTemporaryPasswordDto,
  ) {
    return this.temporaryPasswordService.findMany(queryDto);
  }

  @Get('statistics')
  async getStatistics(@Query('deviceId') deviceId?: string) {
    return this.temporaryPasswordService.getStatistics(deviceId);
  }

  @Get('device/:deviceId')
  async findValidByDeviceId(
    @Param('deviceId') deviceId: string,
  ): Promise<TemporaryPasswordInfo[]> {
    return this.temporaryPasswordService.findValidByDeviceId(deviceId);
  }

  @Get('creator/:creatorId')
  async findByCreatorId(
    @Param('creatorId') creatorId: string,
  ): Promise<TemporaryPasswordInfo[]> {
    return this.temporaryPasswordService.findByCreatorId(creatorId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<TemporaryPasswordInfo> {
    const result = await this.temporaryPasswordService.findById(id);
    if (!result) {
      throw new BadRequestException('临时密码不存在');
    }
    return result;
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.temporaryPasswordService.remove(id);
    return { success };
  }

  @Delete()
  async batchRemove(
    @Body() batchDeleteDto: BatchDeleteTemporaryPasswordDto,
  ): Promise<{ deletedCount: number }> {
    const deletedCount =
      await this.temporaryPasswordService.batchRemove(batchDeleteDto);
    return { deletedCount };
  }

  @Post('validate')
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
