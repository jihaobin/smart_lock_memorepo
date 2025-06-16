import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UsePipes,
} from '@nestjs/common';
import {
  CreateDeviceSchema,
  CreateDeviceInput,
  UpdateDeviceSchema,
  UpdateDeviceInput,
  GetDeviceSchema,
  GetDeviceInput,
} from '@smart-lock/shared';
import { ZodValidationPipe } from 'src/common';
import { RolesGuard, Roles } from 'src/common/auth/roles.guard';

import { DeviceService } from './device.service';
import z from 'zod/v4';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /**
   * 创建设备
   * @param createDeviceDto 创建设备的数据（包含可选的ownerId）
   * @returns 创建的设备信息
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(CreateDeviceSchema))
  async create(
    @Body() createDeviceDto: CreateDeviceInput & { ownerId?: string },
  ) {
    return await this.deviceService.create(createDeviceDto);
  }

  /**
   * 获取设备列表（分页）
   * @param query 查询参数（包含可选的ownerId）
   * @returns 设备列表和分页信息
   */
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(GetDeviceSchema))
  async findAll(@Query() query: GetDeviceInput) {
    return await this.deviceService.findAll(query);
  }

  /**
   * 根据ID获取设备详情
   * @param id 设备ID
   * @returns 设备详情
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async findOne(@Param('id') id: string) {
    return await this.deviceService.findOne(id);
  }

  /**
   * 更新设备信息
   * @param id 设备ID
   * @param updateDeviceDto 更新数据
   * @returns 更新后的设备信息
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async update(
    @Param(
      'id',
      new ZodValidationPipe(z.string().length(5, '设备型号ID必须为5位字符')),
    )
    id: string,
    @Body(new ZodValidationPipe(UpdateDeviceSchema))
    updateDeviceDto: UpdateDeviceInput,
  ) {
    return await this.deviceService.update(id, updateDeviceDto);
  }

  /**
   * 删除设备
   * @param id 设备ID
   * @returns 删除的设备信息
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return await this.deviceService.remove(id);
  }
}
