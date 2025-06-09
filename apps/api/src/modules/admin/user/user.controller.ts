import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  GetAllUsersSchema,
  GetAllUsersType,
  GetUserByPhoneSchema,
  GetUserByPhoneType,
} from '@smart-lock/shared';
import { ZodValidationPipe } from 'src/common';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/common/auth/roles.guard';

import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取所有用户列表（分页）
   */
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(GetAllUsersSchema))
  async findAll(@Query() query: GetAllUsersType) {
    return this.userService.findAll(query);
  }

  /**
   * 根据ID获取单个用户
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  /**
   * 根据手机号查询用户
   */
  @Get('phone/:phone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @UsePipes(new ZodValidationPipe(GetUserByPhoneSchema))
  async findByPhone(@Param() phoneData: GetUserByPhoneType) {
    return this.userService.findByPhone(phoneData);
  }
}
