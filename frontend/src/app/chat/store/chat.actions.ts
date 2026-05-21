import { createAction, props } from '@ngrx/store';
import { Room } from 'shared';

export const loadRooms = createAction('[Chat] Load Rooms');

export const loadRoomsSuccess = createAction(
  '[Chat] Load Rooms Success',
  props<{ rooms: Room[]; directMessages: Room[] }>()
);

export const loadRoomsFailure = createAction(
  '[Chat] Load Rooms Failure',
  props<{ error: any }>()
);

export const switchRoom = createAction(
  '[Chat] Switch Active Room',
  props<{ roomId: number }>()
);

export const clearChatState = createAction('[Chat] Clear State');

export const addRoom = createAction(
  '[Chat] Add Room', 
  props<{ room: Room }>()
);

export const addDm = createAction(
  '[Chat] Add DM', 
  props<{ dm: Room }>()
);

export const removeRoomMembership = createAction(
  '[Chat] Remove Membership', 
  props<{ roomId: number }>()
);

export const updateRoomMembership = createAction(
  '[Chat] Update Membership', 
  props<{ roomId: number; membership: any }>()
);

export const incrementUnread = createAction(
  '[Chat] Increment Unread', 
  props<{ roomId: number }>()
);

export const clearUnread = createAction(
  '[Chat] Clear Unread', 
  props<{ roomId: number }>()
);

export const updateUserStatus = createAction(
  '[Chat] Update User Status', 
  props<{ userId: number; isOnline: boolean }>()
);