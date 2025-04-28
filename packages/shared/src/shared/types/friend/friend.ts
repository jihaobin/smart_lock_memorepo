import { z } from 'zod';

export const createFriendSchema = z.object({
  remarkName: z.string().min(1, '昵称不能为空'),
  linkedPasswords: z.string().length(6, { message: '密码长度必须为6位' }),
  friendGroupId: z.string().min(1, '分组ID不能为空'),
});

export const updateFriendSchema = z.object({
  id: z.string().min(1, '需要进行更新的好友ID不能为空'),
  remarkName: z.string().min(1, '昵称不能为空'),
  linkedPasswords: z.string().length(6, { message: '密码长度必须为6位' }),
  friendGroupId: z.string().min(1, '分组ID不能为空'),
});

export type CreateFriendSchemaType = z.infer<typeof createFriendSchema>;
export type UpdateFriendSchemaType = Required<z.infer<typeof updateFriendSchema>>;
