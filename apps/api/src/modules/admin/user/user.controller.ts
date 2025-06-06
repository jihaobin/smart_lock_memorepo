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
  HttpStatus,
  HttpCode,
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

import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(CreateAdminUserSchema))
  @HttpCode(HttpStatus.CREATED)
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
  @UsePipes(new ZodValidationPipe(UpdateAdminUserSchema))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateAdminUserType,
  ) {
    return await this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return await this.userService.remove(id);
  }

  @Post('create-test-data')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  async createTestUserData(@Query('total') total: number = 50) {
    return await this.userService.createTestUserData(total);
  }
}
