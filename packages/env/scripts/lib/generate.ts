import type { EnvDefinition, EnvGroup } from '../../src/definitions/metadata';

type Definitions = Readonly<Record<string, EnvDefinition>>;
const groupOrder: EnvGroup[] = ['server', 'database', 'client-public', 'third-party'];
const groupNames: Record<EnvGroup, string> = {
  server: '服务端',
  database: '数据库',
  'client-public': '客户端公开',
  'third-party': '第三方服务',
};

function orderedEntries(definitions: Definitions) {
  return groupOrder.flatMap(group =>
    Object.entries(definitions).filter(([, definition]) => definition.group === group)
  );
}

export function renderEnvExample(definitions: Definitions): string {
  const lines: string[] = [];
  let group: EnvGroup | undefined;
  for (const [key, definition] of orderedEntries(definitions)) {
    if (definition.group !== group) {
      if (lines.length > 0) lines.push('');
      group = definition.group;
      lines.push(`# ${groupNames[group]}`);
    }
    const value = definition.secret ? '' : (definition.defaultValue ?? '');
    lines.push(`# ${definition.description}`, `${key}=${value}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderReadmeEnvTable(definitions: Definitions): string {
  const rows = orderedEntries(definitions).map(([key, definition]) => {
    const defaultValue = definition.secret ? '-' : String(definition.defaultValue ?? '-');
    return [
      `\`${key}\``,
      groupNames[definition.group],
      definition.required ? '是' : '否',
      defaultValue,
      definition.description,
    ];
  });
  const table = [['变量名', '作用域', '必填', '默认值', '说明'], ...rows];
  const displayWidth = (value: string) =>
    [...value].reduce((width, character) => {
      const code = character.codePointAt(0) ?? 0;
      const wide =
        (code >= 0x1100 && code <= 0x115f) ||
        (code >= 0x2e80 && code <= 0xa4cf) ||
        (code >= 0xac00 && code <= 0xd7a3) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0xfe10 && code <= 0xfe6f) ||
        (code >= 0xff00 && code <= 0xff60) ||
        (code >= 0xffe0 && code <= 0xffe6);
      return width + (wide ? 2 : 1);
    }, 0);
  const widths = table[0].map((_, column) =>
    Math.max(...table.map(row => displayWidth(row[column])))
  );
  const renderRow = (row: string[]) =>
    `| ${row
      .map((cell, column) => `${cell}${' '.repeat(widths[column] - displayWidth(cell))}`)
      .join(' | ')} |`;
  const separator = `| ${widths.map(width => '-'.repeat(width)).join(' | ')} |`;
  return [renderRow(table[0]), separator, ...rows.map(renderRow)].join('\n');
}

export function updateReadmeEnvTable(source: string, table: string): string {
  const start = '<!-- ENV_TABLE_START -->';
  const end = '<!-- ENV_TABLE_END -->';
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) {
    throw new Error('README environment table markers are missing or invalid');
  }
  const contentStart = startIndex + start.length;
  return `${source.slice(0, contentStart)}\n\n${table}\n\n${source.slice(endIndex)}`;
}
