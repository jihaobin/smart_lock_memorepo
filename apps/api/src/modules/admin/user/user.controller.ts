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
} from '@smart-lock/shared';
import { ZodValidationPipe } from 'src/common';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { RolesGuard, Roles } from 'src/common/auth/roles.guard';

import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto) {
    return this.userService.create(createUserDto);
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
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Post('create-test-data')
  async createTestUserData(total = 50) {
    return this.userService.createTestUserData(total);
  }
}
