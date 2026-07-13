import { RouteItem } from '@smart-lock/shared';

import { ICacheService } from 'src/common/cache';
import { AppConfig } from 'src/config/config.provider';

import { AdminAuthRepository } from '../auth/admin-auth.repository';
import { RbacRepository } from './rbac.repository';
import { RbacService } from './rbac.service';

describe('RbacService default route reconciliation', () => {
  const initializeDefaultRoutes = (service: RbacService) =>
    (
      service as unknown as {
        ensureDefaultRoutesExist(): Promise<void>;
      }
    ).ensureDefaultRoutesExist();

  const route = (
    id: string,
    path: string,
    children?: RouteItem[],
  ): RouteItem => ({
    id,
    path,
    name: path,
    isHidden: false,
    role: [],
    ...(children ? { children } : {}),
  });

  const currentSystemRoutes = () => [
    route('user-id', 'user-manager'),
    route('admin-id', 'admin-manager'),
    route('device-id', 'device-manager'),
    route('model-id', 'device-model-manager'),
    route('router-id', 'router-manager'),
  ];

  const createService = (
    initialRoutes: RouteItem[],
    finalRoutes: RouteItem[],
  ) => {
    const superAdminRole = {
      id: 'superadmin-role-id',
      name: 'superadmin',
    };
    const rbacRepository = {
      assignRoutesToRole: jest.fn().mockResolvedValue([]),
      createRoute: jest.fn().mockResolvedValue({}),
      deleteRoute: jest.fn().mockResolvedValue({}),
      getAllRoutes: jest
        .fn()
        .mockResolvedValue(finalRoutes)
        .mockResolvedValueOnce(initialRoutes),
      getRoleById: jest.fn().mockResolvedValue(superAdminRole),
      getRoleByName: jest.fn().mockResolvedValue(superAdminRole),
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

    return { cacheService, rbacRepository, service };
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reconciles obsolete defaults and missing admin routes in an existing database', async () => {
    const initialRoutes = [
      route('dashboard-id', 'dashboard'),
      route('user-id', 'user-manager'),
      route('router-id', 'router-manager'),
      route('role-id', 'role-manager'),
    ];
    const finalRoutes = currentSystemRoutes();
    const { rbacRepository, service } = createService(
      initialRoutes,
      finalRoutes,
    );

    await initializeDefaultRoutes(service);

    expect(rbacRepository.deleteRoute.mock.calls).toEqual([
      ['dashboard-id'],
      ['role-id'],
    ]);
    expect(
      rbacRepository.createRoute.mock.calls.map(([value]) => value.path),
    ).toEqual(['admin-manager', 'device-manager', 'device-model-manager']);
    expect(rbacRepository.assignRoutesToRole).toHaveBeenCalledWith(
      'superadmin-role-id',
      finalRoutes.map(({ id }) => id),
    );
  });

  it('creates the five current system routes in an empty database', async () => {
    const finalRoutes = currentSystemRoutes();
    const { rbacRepository, service } = createService([], finalRoutes);

    await initializeDefaultRoutes(service);

    expect(
      rbacRepository.createRoute.mock.calls.map(([value]) => value.path),
    ).toEqual([
      'user-manager',
      'admin-manager',
      'device-manager',
      'device-model-manager',
      'router-manager',
    ]);
    for (const [createdRoute] of rbacRepository.createRoute.mock.calls) {
      expect(createdRoute.role).toEqual(['superadmin-role-id']);
    }
    expect(rbacRepository.deleteRoute).not.toHaveBeenCalled();
  });

  it('does not recreate routes when the database is already reconciled', async () => {
    const routes = currentSystemRoutes();
    const { rbacRepository, service } = createService(routes, routes);

    await initializeDefaultRoutes(service);

    expect(rbacRepository.createRoute).not.toHaveBeenCalled();
    expect(rbacRepository.deleteRoute).not.toHaveBeenCalled();
    expect(rbacRepository.assignRoutesToRole).toHaveBeenCalledWith(
      'superadmin-role-id',
      routes.map(({ id }) => id),
    );
  });

  it('preserves custom nested routes and grants them to superadmin', async () => {
    const customTree = route('custom-root', 'custom-root', [
      route('custom-child', 'custom-child'),
    ]);
    const finalRoutes = [...currentSystemRoutes(), customTree];
    const { rbacRepository, service } = createService(
      [customTree],
      finalRoutes,
    );

    await initializeDefaultRoutes(service);

    expect(rbacRepository.deleteRoute).not.toHaveBeenCalledWith('custom-root');
    expect(rbacRepository.deleteRoute).not.toHaveBeenCalledWith('custom-child');
    expect(rbacRepository.assignRoutesToRole).toHaveBeenCalledWith(
      'superadmin-role-id',
      expect.arrayContaining(['custom-root', 'custom-child']),
    );
  });

  it('does not mutate routes when the superadmin role is missing', async () => {
    const { rbacRepository, service } = createService([], []);
    rbacRepository.getRoleByName.mockResolvedValue(undefined);

    await expect(initializeDefaultRoutes(service)).rejects.toThrow(
      'superadmin',
    );

    expect(rbacRepository.getAllRoutes).not.toHaveBeenCalled();
    expect(rbacRepository.deleteRoute).not.toHaveBeenCalled();
    expect(rbacRepository.createRoute).not.toHaveBeenCalled();
    expect(rbacRepository.assignRoutesToRole).not.toHaveBeenCalled();
  });
});
