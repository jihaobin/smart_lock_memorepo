import { z } from 'zod';

import { defineEnv } from './metadata';

describe('defineEnv', () => {
  it('保留 Schema 和生成元数据', () => {
    const definition = defineEnv({
      description: 'API 端口',
      group: 'server',
      schema: z.coerce.number().int().min(1).max(65535),
      required: true,
      secret: false,
      defaultValue: 3000,
      deprecatedAliases: ['API_PORT'],
    });

    expect(definition.schema.parse('3000')).toBe(3000);
    expect(definition.deprecatedAliases).toEqual(['API_PORT']);
  });
});
