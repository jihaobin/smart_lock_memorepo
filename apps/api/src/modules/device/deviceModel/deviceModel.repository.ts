import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateDeviceModelInput,
  UpdateDeviceModelInput,
  GetDeviceModelsInput,
  AdjustStockInput,
  DeviceModelListResponse,
  DeviceModel,
} from '@smart-lock/shared';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq, and, like, desc, asc, sql, SQL } from 'drizzle-orm';
import { DB } from 'src/database/database.provider';
import { CACHE_SERVICE, IAdvancedCacheService } from 'src/common/cache';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class DeviceModelRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    @Inject(CACHE_SERVICE) private readonly cacheService: IAdvancedCacheService,
  ) {}

  /**
   * 创建设备型号
   */
  async createDeviceModel(data: CreateDeviceModelInput): Promise<DeviceModel> {
    // 检查型号名称是否已存在
    const existingModel = await this.db.query.deviceModels.findFirst({
      where: eq(schema.deviceModels.modelName, data.modelName),
    });

    if (existingModel) {
      throw new ConflictException('设备型号名称已存在');
    }

    try {
      const deviceModelId = createId().slice(0, 5).toUpperCase();

      const [newModel] = await this.db
        .insert(schema.deviceModels)
        .values({
          id: deviceModelId,
          modelName: data.modelName,
          description: data.description ?? undefined,
          hasCamera: data.hasCamera,
          hasFingerprint: data.hasFingerprint,
          hasFace: data.hasFace,
          hasEye: data.hasEye,
          hasPalm: data.hasPalm,
          hasNFC: data.hasNFC,
          hasWifi: data.hasWifi,
          hasBluetooth: data.hasBluetooth,
          totalStock: data.totalStock,
          remainingStock: data.remainingStock,
        })
        .returning();

      return newModel;
    } catch (error) {
      throw new InternalServerErrorException('创建设备型号失败');
    }
  }

  /**
   * 获取设备型号列表
   */
  async getDeviceModels(query: GetDeviceModelsInput) {
    const { search, sortBy, sortOrder, ...filters } = query;
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.max(1, Number(query.limit) || 10);
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions: SQL[] = [];

    if (search) {
      conditions.push(like(schema.deviceModels.modelName, `%${search}%`));
    }

    // 添加功能筛选条件
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && key in schema.deviceModels) {
        const column =
          schema.deviceModels[key as keyof typeof schema.deviceModels];
        if (column) {
          conditions.push(eq(column as any, value));
        }
      }
    });

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 构建排序
    const orderBy =
      sortOrder === 'asc'
        ? asc(schema.deviceModels[sortBy])
        : desc(schema.deviceModels[sortBy]);

    console.log('whereClause', whereClause);
    try {
      // 获取数据
      const models = await this.db.query.deviceModels.findMany({
        where: whereClause,
        orderBy,
        limit: pageSize,
        offset,
      });

      // 获取总数
      const [{ count }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.deviceModels)
        .where(whereClause);

      return {
        items: models,
        total: +count,
        page: page,
        pageSize: pageSize,
      };
    } catch (error) {
      throw new InternalServerErrorException('获取设备型号列表失败');
    }
  }

  /**
   * 根据ID获取设备型号
   */
  async getDeviceModelById(id: string): Promise<DeviceModel> {
    try {
      const model = await this.db.query.deviceModels.findFirst({
        where: eq(schema.deviceModels.id, id),
      });

      if (!model) {
        throw new NotFoundException('设备型号不存在');
      }

      return model;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('获取设备型号失败');
    }
  }

  /**
   * 更新设备型号
   */
  async updateDeviceModel(
    id: string,
    data: UpdateDeviceModelInput,
  ): Promise<DeviceModel> {
    // 检查设备型号是否存在
    await this.getDeviceModelById(id);

    // 如果更新型号名称，检查是否与其他型号重复
    if (data.modelName) {
      const existingModel = await this.db.query.deviceModels.findFirst({
        where: and(
          eq(schema.deviceModels.modelName, data.modelName),
          sql`${schema.deviceModels.id} != ${id}`,
        ),
      });

      if (existingModel) {
        throw new ConflictException('设备型号名称已存在');
      }
    }

    try {
      const [updatedModel] = await this.db
        .update(schema.deviceModels)
        .set({
          ...data,
          description: data.description ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(schema.deviceModels.id, id))
        .returning();

      return updatedModel;
    } catch (error) {
      throw new InternalServerErrorException('更新设备型号失败');
    }
  }

  /**
   * 删除设备型号
   */
  async deleteDeviceModel(id: string): Promise<void> {
    // 检查设备型号是否存在
    await this.getDeviceModelById(id);

    // 检查是否有设备使用此型号
    const devicesUsingModel = await this.db.query.devices.findFirst({
      where: eq(schema.devices.modelId, id),
    });

    if (devicesUsingModel) {
      throw new ConflictException('无法删除：仍有设备使用此型号');
    }

    try {
      await this.db
        .delete(schema.deviceModels)
        .where(eq(schema.deviceModels.id, id));
    } catch (error) {
      throw new InternalServerErrorException('删除设备型号失败');
    }
  }

  /**
   * 调整设备实例库存（同时调整总库存和剩余库存）
   * 用于设备绑定或者解绑设备时的库存管理
   */
  async adjustStock(data: AdjustStockInput, tx?: any): Promise<DeviceModel> {
    const { id, adjustment } = data;
    const lockKey = `device_model_stock_lock:${id}`;
    const lockTtl = 30; // 30秒锁定时间
    const retryTimes = 3;
    const retryDelay = 100;

    // 获取分布式锁
    const lockId = await this.cacheService.acquireLock(
      lockKey,
      lockTtl,
      retryTimes,
      retryDelay,
    );

    if (!lockId) {
      throw new ConflictException('库存调整操作繁忙，请稍后重试');
    }

    try {
      // 获取当前设备型号信息
      const currentModel = await this.getDeviceModelById(id);

      // 计算新的剩余库存数量
      const newRemainingStock = currentModel.remainingStock + adjustment;

      // 验证库存合法性
      if (newRemainingStock < 0) {
        throw new BadRequestException('库存不足，无法减少指定数量');
      }

      if (newRemainingStock > currentModel.totalStock) {
        throw new BadRequestException('剩余库存不能超过总库存');
      }

      const dbInstance = tx || this.db;
      // 更新库存（只更新剩余库存，总库存不变）
      const [updatedModel] = await dbInstance
        .update(schema.deviceModels)
        .set({
          remainingStock: newRemainingStock,
          updatedAt: new Date(),
        })
        .where(eq(schema.deviceModels.id, id))
        .returning();

      return updatedModel;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('库存调整失败');
    } finally {
      // 释放锁
      await this.cacheService.releaseLock(lockKey, lockId);
    }
  }

  /**
   * 调整设备实例库存（同时调整总库存和剩余库存）
   * 用于设备创建、删除、更新时的库存管理
   * @param deviceModelId 设备型号ID
   * @param adjustment 调整数量
   * @param tx 可选的事务对象，如果提供则在该事务中执行
   */
  async adjustDeviceInstanceStock(
    deviceModelId: string,
    adjustment: number,
    tx?: any,
  ): Promise<DeviceModel> {
    const lockKey = `device_model_instance_stock_lock:${deviceModelId}`;
    const lockTtl = 30; // 30秒锁定时间
    const retryTimes = 3;
    const retryDelay = 100;

    // 获取分布式锁
    const lockId = await this.cacheService.acquireLock(
      lockKey,
      lockTtl,
      retryTimes,
      retryDelay,
    );

    if (!lockId) {
      throw new ConflictException('设备实例库存调整操作繁忙，请稍后重试');
    }

    try {
      // 获取当前设备型号信息
      const currentModel = await this.getDeviceModelById(deviceModelId);

      // 计算新的库存数量
      const newTotalStock = currentModel.totalStock + adjustment;
      const newRemainingStock = currentModel.remainingStock + adjustment;

      // 验证库存合法性
      if (newTotalStock < 0) {
        throw new BadRequestException('总库存不能为负数');
      }

      if (newRemainingStock < 0) {
        throw new BadRequestException('剩余库存不能为负数');
      }

      if (newRemainingStock > newTotalStock) {
        throw new BadRequestException('剩余库存不能超过总库存');
      }

      // 同时更新总库存和剩余库存
      const dbInstance = tx || this.db;
      const [updatedModel] = await dbInstance
        .update(schema.deviceModels)
        .set({
          totalStock: newTotalStock,
          remainingStock: newRemainingStock,
          updatedAt: new Date(),
        })
        .where(eq(schema.deviceModels.id, deviceModelId))
        .returning();

      return updatedModel;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('设备实例库存调整失败');
    } finally {
      // 释放锁
      await this.cacheService.releaseLock(lockKey, lockId);
    }
  }

  /**
   * 批量获取设备型号（用于设备查询时关联）
   */
  async getDeviceModelsByIds(ids: string[]): Promise<DeviceModel[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      const models = await this.db.query.deviceModels.findMany({
        where: sql`${schema.deviceModels.id} = ANY(${ids})`,
      });

      return models;
    } catch (error) {
      throw new InternalServerErrorException('批量获取设备型号失败');
    }
  }
}
