import { z } from 'zod';

export type EnvGroup = 'server' | 'client-public' | 'database' | 'third-party';

export interface EnvDefinition<TSchema extends z.ZodTypeAny = z.ZodTypeAny> {
  description: string;
  group: EnvGroup;
  schema: TSchema;
  required: boolean;
  secret: boolean;
  defaultValue?: string | number | boolean;
  generateLocalValue?: (resolvedValues: Readonly<Record<string, string>>) => string;
  deprecatedAliases?: readonly string[];
}

export const defineEnv = <TSchema extends z.ZodTypeAny>(
  definition: EnvDefinition<TSchema>
): EnvDefinition<TSchema> => definition;
