import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateDeviceInput,
  UpdateDeviceInput,
  GetDeviceInput,
} from '@smart-lock/shared';
import { DbType, schema } from '@smart-lock/shared/server';
import { eq, and, count, desc } from 'drizzle-orm';
import { DB } from 'src/database/database.provider';
import { DeviceModelRepository } from '../../device/deviceModel/deviceModel.repository';

@Injectable()
export class DeviceRepository {
  constructor(
    @Inject(DB) private readonly db: DbType,
    private readonly deviceModelRepository: DeviceModelRepository,
  ) {}

  /**
   * 创建设备
   * @param createDeviceData 创建设备的数据
   * @returns 创建的设备信息
   */
  async createDevice(createDeviceData: CreateDeviceInput) {
    if (!createDeviceData.name || createDeviceData.name.trim() === '') {
      throw new BadRequestException('设备名称不能为空');
    }

    if (!createDeviceData.modelId) {
      throw new BadRequestException('设备型号不能为空');
    }

    try {
      // 验证设备型号是否存在
      const deviceModel = await this.db.query.deviceModels.findFirst({
        where: eq(schema.deviceModels.id, createDeviceData.modelId),
      });

      if (!deviceModel) {
        throw new BadRequestException('设备型号不存在');
      }

      // 检查设备名称是否已存在（如果指定了所有者，则在该用户下检查）
      if (createDeviceData.ownerId) {
        const existingDevice = await this.db.query.devices.findFirst({
          where: and(
            eq(schema.devices.ownerId, createDeviceData.ownerId),
            eq(schema.devices.name, createDeviceData.name.trim()),
          ),
        });

        if (existingDevice) {
          throw new BadRequestException('该用户下设备名称已存在');
        }
      }

      // 使用事务创建设备并调整库存
      return await this.db.transaction(async (tx) => {
        const [newDevice] = await tx
          .insert(schema.devices)
          .values({
            name: createDeviceData.name.trim(),
            modelId: createDeviceData.modelId,
            ownerId: createDeviceData.ownerId || '',
            status: {
              batteryLevel: 100,
              firmwareVersion: 1,
              isOnline: false,
              isOpen: false,
              lastConnectionTime: new Date().toISOString(),
              connectionId: '',
            },
          })
          .returning();

        // 调整库存：使用分布式锁安全地增加库存（在事务中执行）
        await this.deviceModelRepository.adjustDeviceInstanceStock(
          createDeviceData.modelId,
          1,
          tx,
        );

        // 查询完整的设备信息（包含关联数据）
        const deviceWithRelations = await tx.query.devices.findFirst({
          where: eq(schema.devices.id, newDevice.id),
          with: {
            deviceModel: true,
            owner: {
              columns: {
                passwordHash: false,
                createdAt: false,
                updatedAt: false,
              },
            },
          },
        });

        return deviceWithRelations;
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * 获取设备列表（分页）
   * @param query 查询参数
   * @returns 设备列表和分页信息
   */
  async getAllDevices(query: GetDeviceInput) {
    try {
      const page = Math.max(1, Number(query.page) || 1);
      const limit = Math.max(1, Number(query.limit) || 10);
      const offset = (page - 1) * limit;

      // 查询设备列表
      const devices = await this.db.query.devices.findMany({
        offset,
        limit,
        with: {
          deviceModel: true,
          owner: {
            columns: {
              passwordHash: false,
              createdAt: false,
              updatedAt: false,
            },
          },
        },
      });

      // 查询总数
      const [{ total }] = await this.db
        .select({ total: count() })
        .from(schema.devices);

      return {
        items: devices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new InternalServerErrorException('查询设备列表失败');
    }
  }

  /**
   * 根据ID获取设备详情
   * @param deviceId 设备ID
   * @returns 设备详情
   */
  async getDeviceById(deviceId: string) {
    if (!deviceId) {
      throw new BadRequestException('设备ID不能为空');
    }

    try {
      const device = await this.db.query.devices.findFirst({
        where: eq(schema.devices.id, deviceId),
        with: {
          deviceModel: true,
          owner: {
            columns: {
              passwordHash: false,
              createdAt: false,
              updatedAt: false,
            },
          },
        },
      });

      if (!device) {
        throw new NotFoundException(`设备不存在`);
      }

      return device;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('查询设备详情失败');
    }
  }

  /**
   * 更新设备信息
   * @param deviceId 设备ID
   * @param updateDeviceData 更新数据
   * @returns 更新后的设备信息
   */
  async updateDevice(deviceId: string, updateDeviceData: UpdateDeviceInput) {
    if (!deviceId) {
      throw new BadRequestException('设备ID不能为空');
    }

    try {
      // 检查设备是否存在
      const existingDevice = await this.db.query.devices.findFirst({
        where: eq(schema.devices.id, deviceId),
      });

      if (!existingDevice) {
        throw new NotFoundException('设备不存在');
      }

      // 如果更新了设备型号，验证新型号是否存在
      if (
        updateDeviceData.modelId &&
        updateDeviceData.modelId !== existingDevice.modelId
      ) {
        const deviceModel = await this.db.query.deviceModels.findFirst({
          where: eq(schema.deviceModels.id, updateDeviceData.modelId),
        });

        if (!deviceModel) {
          throw new BadRequestException('设备型号不存在');
        }
      }

      // 如果更新了设备名称，检查是否重复（同一用户下）
      if (
        updateDeviceData.name &&
        updateDeviceData.name.trim() !== existingDevice.name &&
        existingDevice.ownerId
      ) {
        const duplicateDevice = await this.db.query.devices.findFirst({
          where: and(
            eq(schema.devices.ownerId, existingDevice.ownerId),
            eq(schema.devices.name, updateDeviceData.name.trim()),
          ),
        });

        if (duplicateDevice) {
          throw new BadRequestException('该用户下设备名称已存在');
        }
      }

      // 使用事务更新设备并调整库存
      return await this.db.transaction(async (tx) => {
        const updateData: any = {};

        if (updateDeviceData.name) {
          updateData.name = updateDeviceData.name.trim();
        }

        if (updateDeviceData.modelId) {
          updateData.modelId = updateDeviceData.modelId;
        }

        // 如果更新了设备型号，需要调整库存
        if (
          updateDeviceData.modelId &&
          updateDeviceData.modelId !== existingDevice.modelId
        ) {
          // 获取原型号信息
          const oldModel = await tx.query.deviceModels.findFirst({
            where: eq(schema.deviceModels.id, existingDevice.modelId),
          });

          // 获取新型号信息
          const newModel = await tx.query.deviceModels.findFirst({
            where: eq(schema.deviceModels.id, updateDeviceData.modelId),
          });

          if (oldModel && newModel) {
            // 使用分布式锁安全地调整库存：原型号库存-1，新型号库存+1（在事务中执行）
            await this.deviceModelRepository.adjustDeviceInstanceStock(
              existingDevice.modelId,
              -1,
              tx,
            );
            await this.deviceModelRepository.adjustDeviceInstanceStock(
              updateDeviceData.modelId,
              1,
              tx,
            );
          }
        }

        const [updatedDevice] = await tx
          .update(schema.devices)
          .set(updateData)
          .where(eq(schema.devices.id, deviceId))
          .returning();

        // 查询完整的设备信息（包含关联数据）
        const deviceWithRelations = await tx.query.devices.findFirst({
          where: eq(schema.devices.id, updatedDevice.id),
          with: {
            deviceModel: true,
            owner: {
              columns: {
                passwordHash: false,
                createdAt: false,
                updatedAt: false,
              },
            },
          },
        });

        return deviceWithRelations;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('更新设备失败');
    }
  }

  /**
   * 删除设备
   * @param deviceId 设备ID
   * @returns 删除的设备信息
   */
  async deleteDevice(deviceId: string) {
    if (!deviceId) {
      throw new BadRequestException('设备ID不能为空');
    }

    try {
      // 检查设备是否存在
      const existingDevice = await this.db.query.devices.findFirst({
        where: eq(schema.devices.id, deviceId),
        with: {
          deviceModel: true,
          owner: {
            columns: {
              passwordHash: false,
              createdAt: false,
              updatedAt: false,
            },
          },
        },
      });

      if (!existingDevice) {
        throw new NotFoundException('设备不存在');
      }

      // 使用事务删除设备及相关数据并调整库存
      return await this.db.transaction(async (tx) => {
        // 删除设备相关的临时密码
        await tx
          .delete(schema.temporaryPasswords)
          .where(eq(schema.temporaryPasswords.deviceId, deviceId));

        // 删除设备相关的解锁记录
        await tx
          .delete(schema.unlockRecords)
          .where(eq(schema.unlockRecords.deviceId, deviceId));

        // 删除设备本身
        await tx
          .delete(schema.devices)
          .where(eq(schema.devices.id, deviceId))
          .returning();

        // 调整库存：使用分布式锁安全地减少库存（在事务中执行）
        if (existingDevice.deviceModel) {
          await this.deviceModelRepository.adjustDeviceInstanceStock(
            existingDevice.modelId,
            -1,
            tx,
          );
        }

        return '删除成功';
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('删除设备失败');
    }
  }
}
