import { z } from 'zod';

import { defineEnv } from './metadata';

export const clientDefinitions = {
  EXPO_PUBLIC_API_URL: defineEnv({ description: 'Expo API URL', group: 'client-public', schema: z.string().url().default('http://localhost:3000/api'), required: true, secret: false, defaultValue: 'http://localhost:3000/api' }),
  EXPO_PUBLIC_SOCKET_URL: defineEnv({ description: 'Expo Socket URL', group: 'client-public', schema: z.string().url().default('http://localhost:3000'), required: true, secret: false, defaultValue: 'http://localhost:3000', deprecatedAliases: ['EXPO_PUBLIC_NOTICATION'] }),
} as const;

type ClientShape = { [K in keyof typeof clientDefinitions]: (typeof clientDefinitions)[K]['schema'] };
const clientShape = Object.fromEntries(Object.entries(clientDefinitions).map(([key, definition]) => [key, definition.schema])) as ClientShape;
export const clientEnvSchema = z.object(clientShape);
export type ClientEnv = z.infer<typeof clientEnvSchema>;
