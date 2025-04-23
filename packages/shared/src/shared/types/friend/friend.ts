import { z } from 'zod';

export const createFriendSchema = z.object({
  userId: z.string().min(1, '需要进行绑定的用户ID不能为空'),
  name: z.string().min(1, '昵称不能为空'),
  linkedPassword: z.string().length(6, { message: '密码长度必须为6位' }),
  groupIds: z.string().min(1, '分组ID不能为空'),
});

export const updateFriendSchema = z.object({
  friendId: z.string().min(1, '需要进行更新的好友ID不能为空'),
  name: z.string().min(1, '昵称不能为空'),
  linkedPassword: z.string().length(6, { message: '密码长度必须为6位' }),
  groupIds: z.string().min(1, '分组ID不能为空'),
});

export type CreateFriendSchemaType = z.infer<typeof createFriendSchema>;
export type UpdateFriendSchemaType = z.infer<typeof updateFriendSchema> & { friendId: string };
