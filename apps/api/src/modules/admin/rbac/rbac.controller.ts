import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  CreateRouteDto,
  CreateRoleDto,
  UpdateRouteDto,
  UpdateRoleDto,
  AssignRoutesToRoleDto,
  AssignRolesToUserDto,
} from '@smart-lock/shared';
import { JwtAuthGuard } from 'src/common/auth/jwt-auth.guard';
import { Roles, RolesGuard } from 'src/common/auth/roles.guard';

import { RbacService } from './rbac.service';

@Controller('rbac')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // 角色管理
  @Post('roles')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async createRole(@Body() data: CreateRoleDto) {
    return this.rbacService.createRole(data);
  }

  @Put('roles/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async updateRole(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.rbacService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async deleteRole(@Param('id') id: string) {
    await this.rbacService.deleteRole(id);
  }

  @Get('roles/:id')
  async getRoleById(@Param('id') id: string) {
    return this.rbacService.getRoleById(id);
  }

  @Get('roles')
  async getAllRoles() {
    return this.rbacService.getAllRoles();
  }

  // 路由管理
  @Post('routes')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async createRoute(@Body() data: CreateRouteDto) {
    return this.rbacService.createRoute(data);
  }

  @Put('routes/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async updateRoute(@Param('id') id: string, @Body() data: UpdateRouteDto) {
    return this.rbacService.updateRoute(id, data);
  }

  @Delete('routes/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async deleteRoute(@Param('id') id: string) {
    await this.rbacService.deleteRoute(id);
  }

  @Get('routes/:id')
  @Roles('admin', 'superadmin')
  async getRouteById(@Param('id') id: string) {
    return this.rbacService.getRouteById(id);
  }

  @Roles('admin', 'superadmin')
  @Get('routes')
  async getAllRoutes(
    @Query() { page, pageSize }: { page?: string; pageSize?: string },
  ) {
    return this.rbacService.getAllRoutesOnPage({
      page,
      pageSize,
    });
  }

  // 角色路由关联
  @Post('roles/:roleId/routes')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async assignRoutesToRole(
    @Param('roleId') roleId: string,
    @Body() data: AssignRoutesToRoleDto,
  ) {
    return this.rbacService.assignRoutesToRole(roleId, data.routeIds);
  }

  @Get('roles/:roleId/routes')
  async getRoleRoutes(@Param('roleId') roleId: string) {
    return this.rbacService.getRoleRoutes(roleId);
  }

  // 用户角色关联
  @Post('users/:userId/roles')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  async assignRolesToUser(
    @Param('userId') userId: string,
    @Body() data: AssignRolesToUserDto,
  ) {
    return this.rbacService.assignRolesToUser(userId, data.roleIds);
  }

  @Get('users/:userId/roles')
  async getUserRoles(@Param('userId') userId: string) {
    return this.rbacService.getUserRoles(userId);
  }

  // 获取用户可访问的路由
  @Get('users/:userId/accessible-routes')
  async getUserAccessibleRoutes(@Param('userId') userId: string) {
    return this.rbacService.getUserAccessibleRoutes(userId);
  }
}
