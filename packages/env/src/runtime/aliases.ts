export function resolveDeprecatedAliases(
  input: Record<string, string | undefined>,
  aliases: Record<string, readonly string[]>,
  onWarning: (message: string) => void = console.warn
): Record<string, string | undefined> {
  const resolved = { ...input };
  for (const [current, deprecatedNames] of Object.entries(aliases)) {
    for (const deprecated of deprecatedNames) {
      if (input[deprecated] === undefined) continue;
      onWarning(`[deprecated] ${deprecated}: 请迁移为 ${current}`);
      if (resolved[current] === undefined) resolved[current] = input[deprecated];
    }
  }
  return resolved;
}
