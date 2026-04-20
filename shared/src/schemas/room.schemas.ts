import { z } from 'zod';
import { UserSchema } from './user.schemas.js';

export const RoleSchema = z.enum(['admin', 'member']);
export type Role = z.infer<typeof RoleSchema>;

export const RoomTypeSchema = z.enum(['public', 'private', 'password', 'dm']);
export type RoomType = z.infer<typeof RoomTypeSchema>;

export const RoomMemberSchema = z.object({
  id: z.number().int(),
  role: RoleSchema,
  joinedAt: z.string().datetime(),
  user: UserSchema,
});
export type RoomMember = z.infer<typeof RoomMemberSchema>;

export const MembershipSchema = z.object({
  role: RoleSchema,
  joinedAt: z.string().datetime(),
}).nullable();
export type Membership = z.infer<typeof MembershipSchema>;

export const RoomSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: RoomTypeSchema,
  createdAt: z.string().datetime(),
  _count: z.object({ members: z.number().int() }).optional(),
  membership: MembershipSchema.optional(),
  otherUser: UserSchema.nullable().optional(),
  unreadCount: z.number().int().optional(),
});
export type Room = z.infer<typeof RoomSchema>;

export const MessageSenderSchema = UserSchema.omit({ isOnline: true });
export type MessageSender = z.infer<typeof MessageSenderSchema>;

export const MessageSchema = z.object({
  id: z.number().int(),
  roomId: z.number().int(),
  senderId: z.number().int(),
  content: z.string(),
  createdAt: z.string().datetime(),
  sender: MessageSenderSchema,
});
export type Message = z.infer<typeof MessageSchema>;

export const CreateRoomSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('public'),
    name: z.string().min(1).max(100),
  }),
  z.object({
    type: z.literal('private'),
    name: z.string().min(1).max(100),
  }),
  z.object({
    type: z.literal('password'),
    name: z.string().min(1).max(100),
    password: z.string().min(1, 'Password is required for password-protected rooms'),
  }),
  z.object({
    type: z.literal('dm'),
    userId: z.number().int().positive('Target user ID is required'),
  }),
]);
export type CreateRoomBody = z.infer<typeof CreateRoomSchema>;

export const JoinRoomSchema = z.object({
  userId: z.number().int().positive().optional(),
  role: RoleSchema.optional(),
  password: z.string().optional(),
});
export type JoinRoomBody = z.infer<typeof JoinRoomSchema>;

export const ChangeMemberRoleSchema = z.object({
  role: RoleSchema,
});
export type ChangeMemberRoleBody = z.infer<typeof ChangeMemberRoleSchema>;

export const SendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(5000, 'Message is too long'),
});
export type SendMessageBody = z.infer<typeof SendMessageSchema>;

export const ListRoomsQuerySchema = z.object({
  type: z.enum(['room', 'dm']).optional(),
});
export type ListRoomsQuery = z.infer<typeof ListRoomsQuerySchema>;

export const ListMessagesQuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListMessagesQuery = z.infer<typeof ListMessagesQuerySchema>;

export const ListMessagesResponseSchema = z.object({
  messages: z.array(MessageSchema),
  nextCursor: z.number().int().nullable(),
});
export type ListMessagesResponse = z.infer<typeof ListMessagesResponseSchema>;