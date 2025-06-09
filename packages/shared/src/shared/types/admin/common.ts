import { z } from 'zod/v4';

export const getAllDataSchema = z.object({
  page: z.string().default('1'),
  pageSize: z.string().default('10'),
  queryField: z.string().optional(),
  queryValue: z.string().optional(),
});

export type GetAllDataType = z.infer<typeof getAllDataSchema>;

export const createDataSchema = z.object({
  id: z.string({ message: 'id不能为空' }),
});

export type CreateDataType = z.infer<typeof createDataSchema>;

export const updateDataSchema = z.object({
  id: z.string({ message: 'id不能为空' }),
});

export type UpdateDataType = z.infer<typeof updateDataSchema>;

export const deleteDataSchema = z.object({
  id: z.string({ message: 'id不能为空' }),
});

export type DeleteDataType = z.infer<typeof deleteDataSchema>;
