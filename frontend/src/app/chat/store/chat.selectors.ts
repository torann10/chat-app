import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ChatState } from './chat.model';

export const selectChatFeature = createFeatureSelector<ChatState>('chat');

export const selectRooms = createSelector(
  selectChatFeature,
  (state) => state.rooms
);

export const selectDirectMessages = createSelector(
  selectChatFeature,
  (state) => state.directMessages
);

export const selectActiveRoomId = createSelector(
  selectChatFeature,
  (state) => state.activeRoomId
);

export const selectIsLoadingRooms = createSelector(
  selectChatFeature,
  (state) => state.loadingRooms
);