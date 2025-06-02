import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UsePipes,
} from '@nestjs/common';

import {
  createUnlockRecordSchema,
  deleteUnlockRecordSchema,
  getUnlockRecordSchema,
  queryUnlockRecordSchema,
  updateUnlockRecordSchema,
  CreateUnlockRecordDto,
  QueryUnlockRecordDto,
  UpdateUnlockRecordDto,
} from './schema';
import { UnLockRecordService } from './unLockRecord.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('unlock-records')
export class UnLockRecordController {
  constructor(private readonly unLockRecordService: UnLockRecordService) {}

  /**
   * 创建开锁记录
   * @param data 开锁记录数据
   */
  @Post()
  @UsePipes(
    new ZodValidationPipe(createUnlockRecordSchema, '开锁记录数据验证失败'),
  )
  async create(@Body() data: CreateUnlockRecordDto) {
    return this.unLockRecordService.createUnlockRecord(data);
  }

  /**
   * 根据ID获取开锁记录
   * @param params 包含ID的参数
   */
  @Get(':id')
  @UsePipes(new ZodValidationPipe(getUnlockRecordSchema, '开锁记录ID验证失败'))
  async getById(@Param() params: { id: string }) {
    return this.unLockRecordService.getUnlockRecordById(params.id);
  }

  /**
   * 更新开锁记录
   * @param id 记录ID
   * @param data 更新数据
   */
  @Put(':id')
  @UsePipes(
    new ZodValidationPipe(updateUnlockRecordSchema, '开锁记录更新数据验证失败'),
  )
  async update(@Param('id') id: string, @Body() data: UpdateUnlockRecordDto) {
    return this.unLockRecordService.updateUnlockRecord(id, data);
  }

  /**
   * 删除开锁记录
   * @param params 包含ID的参数
   */
  @Delete(':id')
  @UsePipes(
    new ZodValidationPipe(deleteUnlockRecordSchema, '开锁记录ID验证失败'),
  )
  async delete(@Param() params: { id: string }) {
    return this.unLockRecordService.deleteUnlockRecord(params.id);
  }

  /**
   * 查询开锁记录列表
   * @param query 查询参数
   */
  @Get()
  @UsePipes(new ZodValidationPipe(queryUnlockRecordSchema, '查询参数验证失败'))
  async query(@Query() query: QueryUnlockRecordDto) {
    return this.unLockRecordService.queryUnlockRecords(query);
  }
}
