import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { AppLoggerService } from 'src/common';

import { DeviceStatusService } from '../services/device-status.service';

@Injectable()
@Processor('device-status-queue')
export class DeviceStatusProcessor extends WorkerHost {
  constructor(
    @Inject(DeviceStatusService)
    private readonly deviceStatusService: DeviceStatusService,
    private readonly logger: AppLoggerService,
  ) {
    super();
    this.logger.setContext(DeviceStatusProcessor.name);
  }

  // 处理同步到数据库的任务
  async process(job: Job) {
    this.logger.log(`开始处理设备状态同步任务: ${job.id}`);
    const startTime = Date.now();

    try {
      // 执行同步
      const result = await this.deviceStatusService.syncAllStatusesToDb();

      const duration = Date.now() - startTime;
      if (result) {
        this.logger.log(`设备状态同步完成，耗时: ${duration}ms`);
      } else {
        this.logger.warn(`设备状态同步未完全成功，耗时: ${duration}ms`);
      }

      return { success: result, duration };
    } catch (error) {
      this.logger.error(`设备状态同步失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 任务完成事件处理
  @OnWorkerEvent('completed')
  onCompleted(job: Job, result: any) {
    const isManual = job.data?.manual === true;
    this.logger.log(
      `设备状态同步任务完成: ${job.id}, ${isManual ? '手动触发' : '定时任务'}`,
    );
  }

  // 任务失败事件处理
  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `设备状态同步任务失败: ${job.id}, 错误: ${error.message}`,
      error.stack,
    );
  }
}
