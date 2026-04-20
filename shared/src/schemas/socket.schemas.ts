import { z } from 'zod';
import { MessageSchema } from './room.schemas.js';

export const UserStatusChangeEventSchema = z.object({
  userId: z.number().int(),
  isOnline: z.boolean(),
});
export type UserStatusChangeEvent = z.infer<typeof UserStatusChangeEventSchema>;

export const NewMessageEventSchema = MessageSchema;
export type NewMessageEvent = z.infer<typeof NewMessageEventSchema>;

export const RoomInvitedEventSchema = z.object({
  roomId: z.number().int(),
});
export type RoomInvitedEvent = z.infer<typeof RoomInvitedEventSchema>;

export type ServerToClientEvents = {
  user_status_change: (data: UserStatusChangeEvent) => void;
  new_message: (data: NewMessageEvent) => void;
  room_invited: (data: RoomInvitedEvent) => void;
};