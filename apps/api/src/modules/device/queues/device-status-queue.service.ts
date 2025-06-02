import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AppLoggerService } from 'src/common';

@Injectable()
export class DeviceStatusQueueService {
  constructor(
    @InjectQueue('device-status-queue')
    private readonly deviceStatusQueue: Queue,
    private readonly logger: AppLoggerService,
  ) {
    this.logger.setContext(DeviceStatusQueueService.name);
    // 初始化时设置定时任务
    this.setupRecurringJob();
  }

  // 设置每天凌晨3点的定时任务
  private async setupRecurringJob() {
    try {
      // 删除现有的同名任务，避免重复
      const existingJob =
        await this.deviceStatusQueue.getJob('sync-device-status');
      if (existingJob) {
        await existingJob.remove();
      }

      // 创建定时任务，使用cron表达式（0 3 * * *表示每天凌晨3点）
      await this.deviceStatusQueue.add(
        'sync-to-db',
        {},
        {
          jobId: 'sync-device-status',
          repeat: {
            pattern: '0 3 * * *',
            tz: 'Asia/Shanghai', // 使用中国时区
          },
          removeOnComplete: true,
        },
      );

      this.logger.log('设备状态同步定时任务已设置，将于每天凌晨3点执行');
    } catch (error) {
      this.logger.error(
        `设置设备状态同步定时任务失败: ${error.message}`,
        error.stack,
      );
    }
  }

  // 手动触发同步任务
  async triggerSync(): Promise<string> {
    try {
      const job = await this.deviceStatusQueue.add('sync-to-db', {
        manual: true,
        timestamp: new Date().toISOString(),
      });

      const jobId = job.id || `manual-sync-${Date.now()}`;
      this.logger.log(`已手动触发设备状态同步任务: ${jobId}`);
      return jobId;
    } catch (error) {
      this.logger.error(
        `手动触发设备状态同步失败: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
