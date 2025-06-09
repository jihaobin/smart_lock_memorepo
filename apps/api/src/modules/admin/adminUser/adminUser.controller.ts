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
  GetAllAdminUsersSchema,
  GetAllAdminUsersType,
  CreateAdminUserSchema,
  CreateAdminUserType,
  UpdateAdminUserSchema,
  UpdateAdminUserType,
} from '@smart-lock/shared';
import { ZodValidationPipe } from 'src/common';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/common/auth/roles.guard';

import { AdminUserService } from './adminUser.service';

@Controller('adminUser')
export class AdminUserController {
  constructor(private readonly userService: AdminUserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(CreateAdminUserSchema))
  async create(@Body() createUserDto: CreateAdminUserType) {
    return await this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('all')
  @UsePipes(new ZodValidationPipe(GetAllAdminUsersSchema))
  findAll(@Query() query: GetAllAdminUsersType) {
    const { page, pageSize } = query;
    return this.userService.findAll({ page, pageSize });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async findOne(@Param('id') id: string) {
    return await this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateAdminUserSchema))
    updateUserDto: UpdateAdminUserType,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async remove(@Param('id') id: string) {
    return await this.userService.remove(id);
  }

  @Post('create-test-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async createTestUserData(@Query('total') total: number = 50) {
    return await this.userService.createTestUserData(total);
  }
}
