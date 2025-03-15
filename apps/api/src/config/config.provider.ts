import { z } from 'zod';

export const APP_CONFIG = Symbol('APP_CONFIG');

export const envSchema = z.object({
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().min(1),
});

export type AppConfig = z.infer<typeof envSchema>;
