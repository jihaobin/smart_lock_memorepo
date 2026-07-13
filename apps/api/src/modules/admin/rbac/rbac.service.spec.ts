import { RbacService } from './rbac.service';
import { RbacRepository } from './rbac.repository';
import { AdminAuthRepository } from '../auth/admin-auth.repository';
import { AppConfig } from 'src/config/config.provider';
import { ICacheService } from 'src/common/cache';

describe('RbacService default route initialization', () => {
  const initializeDefaultRoutes = (service: RbacService) =>
    (
      service as unknown as {
        ensureDefaultRoutesExist(): Promise<void>;
      }
    ).ensureDefaultRoutesExist();

  const createService = () => {
    const rbacRepository = {
      assignRoutesToRole: jest.fn(),
      createRoute: jest.fn().mockResolvedValue({}),
      getAllRoutes: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ id: 'route-1' }]),
      getRoleByName: jest.fn(),
    };
    const cacheService = {
      del: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const service = new RbacService(
      rbacRepository as unknown as RbacRepository,
      {} as AdminAuthRepository,
      {} as AppConfig,
      cacheService as unknown as ICacheService,
    );
    jest.spyOn(service, 'assignRoutesToRole').mockResolvedValue([]);

    return { rbacRepository, service };
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('binds every default route to the current superadmin role ID', async () => {
    const { rbacRepository, service } = createService();
    rbacRepository.getRoleByName.mockResolvedValue({
      id: 'superadmin-role-id',
      name: 'superadmin',
    });

    await initializeDefaultRoutes(service);

    expect(rbacRepository.createRoute).toHaveBeenCalledTimes(4);
    for (const [route] of rbacRepository.createRoute.mock.calls) {
      expect(route.role).toEqual(['superadmin-role-id']);
    }
    expect(service.assignRoutesToRole).toHaveBeenCalledWith(
      'superadmin-role-id',
      ['route-1'],
    );
  });

  it('fails before creating routes when the superadmin role is missing', async () => {
    const { rbacRepository, service } = createService();
    rbacRepository.getRoleByName.mockResolvedValue(undefined);

    await expect(initializeDefaultRoutes(service)).rejects.toThrow(
      'superadmin',
    );
    expect(rbacRepository.createRoute).not.toHaveBeenCalled();
  });
});
