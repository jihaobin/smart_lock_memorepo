import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateDeviceModelSchema,
  CreateDeviceModelInput,
  UpdateDeviceModelSchema,
  UpdateDeviceModelInput,
  GetDeviceModelSchema,
  DeleteDeviceModelSchema,
  GetDeviceModelsSchema,
  GetDeviceModelsInput,
  AdjustStockSchema,
  AdjustStockInput,
} from '@smart-lock/shared';
import { ZodValidationPipe } from 'src/common';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/common/auth/roles.guard';
import { z } from 'zod/v4';

import { DeviceModelService } from './deviceModel.service';

@Controller('deviceModel')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceModelController {
  constructor(private readonly deviceModelService: DeviceModelService) {}

  /**
   * 创建设备型号
   */
  @Post()
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(CreateDeviceModelSchema))
  async createDeviceModel(
    @Body() createDeviceModelDto: CreateDeviceModelInput,
  ) {
    return await this.deviceModelService.createDeviceModel(
      createDeviceModelDto,
    );
  }

  /**
   * 获取设备型号列表
   */
  @Get()
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(GetDeviceModelsSchema))
  async getDeviceModels(@Query() query: GetDeviceModelsInput) {
    return await this.deviceModelService.getDeviceModels(query);
  }

  /**
   * 根据ID获取设备型号
   */
  @Get(':id')
  @Roles('admin', 'superadmin')
  async getDeviceModelById(@Param('id') id: string) {
    // 手动验证参数
    const validatedParams = GetDeviceModelSchema.parse({ id });
    return await this.deviceModelService.getDeviceModelById(validatedParams.id);
  }

  /**
   * 更新设备型号
   */
  @Put(':id')
  @Roles('admin', 'superadmin')
  async updateDeviceModel(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateDeviceModelSchema))
    updateDeviceModelDto: UpdateDeviceModelInput,
  ) {
    // 验证路径参数
    const validatedParams = GetDeviceModelSchema.parse({ id });
    return await this.deviceModelService.updateDeviceModel(
      validatedParams.id,
      updateDeviceModelDto,
    );
  }

  /**
   * 删除设备型号
   */
  @Delete(':id')
  @Roles('admin', 'superadmin')
  async deleteDeviceModel(@Param('id') id: string) {
    // 手动验证参数
    const validatedParams = DeleteDeviceModelSchema.parse({ id });
    await this.deviceModelService.deleteDeviceModel(validatedParams.id);
  }

  /**
   * 调整库存
   */
  @Post(':id/adjust-stock')
  @Roles('admin', 'superadmin')
  async adjustStock(
    @Param('id', new ZodValidationPipe(z.string('id不能为空'))) id: string,
    @Body(new ZodValidationPipe(AdjustStockSchema.pick({ adjustment: true })))
    adjustStockDto: { adjustment: number },
  ) {
    const adjustStockData: AdjustStockInput = {
      id: id,
      adjustment: adjustStockDto.adjustment,
    };
    return await this.deviceModelService.adjustStock(adjustStockData);
  }
}
