import { Injectable } from '@nestjs/common';
import { GetAllAdminUsersType } from '@smart-lock/shared/';

import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  create(createUserDto) {
    return 'This action adds a new user';
  }

  async findAll(query: GetAllAdminUsersType) {
    return this.userRepository.getAllUsers(query);
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }

  async createTestUserData(total = 50) {
    return this.userRepository.createTestUserData(total);
  }
}
