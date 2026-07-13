import { parseDocument } from 'yaml';

const variablePattern = /\$\{([A-Z][A-Z0-9_]*)(?::-[^}]*)?\}/g;

export function checkComposeVariables(source: string, knownKeys: ReadonlySet<string>): string[] {
  const document = parseDocument(source);
  if (document.errors.length > 0)
    throw new Error(document.errors.map(error => error.message).join('\n'));
  const unknown = new Set<string>();

  const visit = (value: unknown): void => {
    if (typeof value === 'string') {
      for (const match of value.matchAll(variablePattern)) {
        if (!knownKeys.has(match[1])) unknown.add(match[1]);
      }
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(document.toJS());
  return [...unknown].sort().map(key => `[unknown] ${key}: Docker Compose 引用了未注册变量`);
}
