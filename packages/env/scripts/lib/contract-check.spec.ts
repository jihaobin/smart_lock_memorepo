import { checkComposeVariables } from './contract-check';
import { clientDefinitions } from '../../src/definitions/client';
import { serverDefinitions } from '../../src/definitions/server';

describe('Compose contract', () => {
  it('报告未注册的 Compose 变量', () => {
    const knownKeys = new Set(Object.keys({ ...serverDefinitions, ...clientDefinitions }));
    expect(
      checkComposeVariables('services:\n  db:\n    environment:\n      X: ${UNKNOWN}', knownKeys)
    ).toEqual(['[unknown] UNKNOWN: Docker Compose 引用了未注册变量']);
  });
});
