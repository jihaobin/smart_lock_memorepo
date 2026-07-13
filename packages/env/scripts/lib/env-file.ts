import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import type { EnvDefinition } from '../../src/definitions/metadata';

type Definitions = Readonly<Record<string, EnvDefinition>>;

function readValues(source: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

export function updateEnvFile(envPath: string, definitions: Definitions): string[] {
  const original = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const values = readValues(original);
  const missing = Object.keys(definitions).filter(key => !(key in values));
  if (missing.length === 0) return [];

  const lines: string[] = [];
  let currentGroup = '';
  for (const key of missing) {
    const definition = definitions[key];
    if (definition.group !== currentGroup) {
      if (lines.length > 0) lines.push('');
      currentGroup = definition.group;
      lines.push(`# ${currentGroup}`);
    }
    const generated = definition.generateLocalValue?.(values);
    const value = generated ?? definition.defaultValue ?? '';
    values[key] = String(value);
    lines.push(`# ${definition.description}`, `${key}=${value}`);
  }

  const separator = original.length === 0 || original.endsWith('\n') ? '' : '\n';
  writeFileSync(envPath, `${original}${separator}${lines.join('\n')}\n`);
  return missing;
}
