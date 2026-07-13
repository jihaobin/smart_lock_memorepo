import { renderEnvExample, updateReadmeEnvTable } from './generate';
import { clientDefinitions } from '../../src/definitions/client';
import { serverDefinitions } from '../../src/definitions/server';

describe('environment artifact generation', () => {
  it('生成示例时不输出 secret 默认值', () => {
    const output = renderEnvExample({ ...serverDefinitions, ...clientDefinitions });
    expect(output).toContain('JWT_SECRET=');
    expect(output).not.toMatch(/^JWT_SECRET=.+$/m);
  });

  it('只替换 README 标记区域', () => {
    const source = 'before\n<!-- ENV_TABLE_START -->\nold\n<!-- ENV_TABLE_END -->\nafter\n';
    expect(updateReadmeEnvTable(source, '| variable |')).toBe(
      'before\n<!-- ENV_TABLE_START -->\n\n| variable |\n\n<!-- ENV_TABLE_END -->\nafter\n'
    );
  });
});
