import { Injectable } from '@nestjs/common';
import {
  GetAllAdminUsersType,
  CreateAdminUserType,
  UpdateAdminUserType,
} from '@smart-lock/shared/';

import { AdminUserRepository } from './adminUser.repository';

@Injectable()
export class AdminUserService {
  constructor(private readonly userRepository: AdminUserRepository) {}

  async create(createUserDto: CreateAdminUserType) {
    return await this.userRepository.createUser(createUserDto);
  }

  async findAll(query: GetAllAdminUsersType) {
    return this.userRepository.getAllUsers(query);
  }

  async findOne(id: string) {
    return await this.userRepository.findUserById(id);
  }

  async update(id: string, updateUserDto: UpdateAdminUserType) {
    return await this.userRepository.updateUser(id, updateUserDto);
  }

  async remove(id: string) {
    return await this.userRepository.deleteUser(id);
  }

  async createTestUserData(total = 50) {
    return this.userRepository.createTestUserData(total);
  }
}
