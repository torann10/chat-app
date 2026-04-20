import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().int(),
  email: z.string().email(),
  fullname: z.string().nullable(),
  isOnline: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

export const ListUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListUsersQuery = z.infer<typeof ListUsersQuerySchema>;

export const ListUsersResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number().int(),
  page: z.number().int(),
  totalPages: z.number().int(),
});
export type ListUsersResponse = z.infer<typeof ListUsersResponseSchema>;