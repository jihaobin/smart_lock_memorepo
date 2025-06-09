import { z } from 'zod/v4';

export const friendGroup = z.object({
  id: z.string(),
  groupName: z.string(),
});

export type Group = z.infer<typeof friendGroup>;
