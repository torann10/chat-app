import { createReducer, on } from '@ngrx/store';
import * as ChatActions from './chat.actions';
import { ChatState } from './chat.model';

export const initialChatState: ChatState = {
  rooms: [],
  directMessages: [],
  activeRoomId: null,
  loadingRooms: false,
};

export const chatReducer = createReducer(
  initialChatState,
  on(ChatActions.loadRooms, (state) => ({
    ...state,
    loadingRooms: true
  })),
  on(ChatActions.loadRoomsSuccess, (state, { rooms, directMessages }) => {
    const newActiveRoomId = (state.activeRoomId === null && rooms.length > 0)
    ? rooms[0].id
    : state.activeRoomId;
    
    return {
      ...state,
      rooms: rooms,
      directMessages: directMessages,
      activeRoomId: newActiveRoomId,
      loadingRooms: false
    };
  }),
  on(ChatActions.loadRoomsFailure, (state) => ({
    ...state,
    loadingRooms: false
  })),
  on(ChatActions.switchRoom, (state, { roomId }) => ({
    ...state,
    activeRoomId: roomId
  })),
  on(ChatActions.clearChatState, (state) => ({ 
    ...initialChatState 
  })),
  on(ChatActions.addRoom, (state, { room }) => ({ 
    ...state, 
    rooms: [...state.rooms, room] 
  })),
  on(ChatActions.addDm, (state, { dm }) => {
    const exists = state.directMessages.some(d => d.id === dm.id);
    return exists ? state : { ...state, directMessages: [dm, ...state.directMessages] };
  }),
  on(ChatActions.removeRoomMembership, (state, { roomId }) => ({
    ...state,
    rooms: state.rooms.map(r => r.id === roomId ? { ...r, membership: null } : r)
  })),
  on(ChatActions.updateRoomMembership, (state, { roomId, membership }) => ({
    ...state,
    rooms: state.rooms.map(r => r.id === roomId ? { ...r, membership } : r)
  })),
  on(ChatActions.incrementUnread, (state, { roomId }) => ({
    ...state,
    rooms: state.rooms.map(r => r.id === roomId && r.membership ? { ...r, unreadCount: (r.unreadCount ?? 0) + 1 } : r),
    directMessages: state.directMessages.map(dm => dm.id === roomId ? { ...dm, unreadCount: (dm.unreadCount ?? 0) + 1 } : dm)
  })),
  on(ChatActions.clearUnread, (state, { roomId }) => ({
    ...state,
    rooms: state.rooms.map(r => r.id === roomId ? { ...r, unreadCount: 0 } : r),
    directMessages: state.directMessages.map(dm => dm.id === roomId ? { ...dm, unreadCount: 0 } : dm)
  })),
  on(ChatActions.updateUserStatus, (state, { userId, isOnline }) => ({
    ...state,
    directMessages: state.directMessages.map(dm => 
      dm.otherUser?.id === userId ? { ...dm, otherUser: { ...dm.otherUser!, isOnline } } : dm
    )
  })),
);