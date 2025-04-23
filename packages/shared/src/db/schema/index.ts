import { init } from '@paralleldrive/cuid2';

export const createId = init({
  length: 5,
});

export * from './admin_schema';
export * from './schema';
