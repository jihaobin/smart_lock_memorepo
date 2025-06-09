import { Injectable } from '@nestjs/common';
import {
  GetAllUsersType,
  GetUserByPhoneType,
  UserItem,
  GetAllUsersResponse,
} from '@smart-lock/shared';

import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * 获取所有用户列表（分页）
   */
  async findAll(query: GetAllUsersType): Promise<GetAllUsersResponse> {
    return this.userRepository.getAllUsers(query);
  }

  /**
   * 根据ID获取单个用户
   */
  async findOne(id: string): Promise<UserItem> {
    return this.userRepository.findUserById(id);
  }

  /**
   * 根据手机号查询用户
   */
  async findByPhone(phoneData: GetUserByPhoneType): Promise<UserItem> {
    return this.userRepository.findUserByPhone(phoneData);
  }
}
