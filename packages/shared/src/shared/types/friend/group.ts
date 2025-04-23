import { z } from 'zod';

export const friendGroup = z.object({
  id: z.string(),
  groupName: z.string(),
});

export type Group = z.infer<typeof friendGroup>;
