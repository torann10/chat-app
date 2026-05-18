import { createAction, props } from "@ngrx/store";
import { UsageStatistics } from "./stats.model";
import { User } from "shared";

export const loadStats = createAction('[Chat] Load Statistics');
export const loadStatsSuccess = createAction(
  '[Chat] Load Statistics Success',
  props<{ stats: UsageStatistics }>()
);
export const loadStatsFailure = createAction(
  '[Chat] Load Statistics Failure',
  props<{ error: any }>()
);

export const messageSent = createAction(
  '[Chat] Message Sent',
  props<{ recipient: User }>()
);
export const incrementRoomsOpened = createAction('[Chat] Increment Rooms Opened');
export const updateFavoritePerson = createAction(
  '[Chat] Update Favorite Person',
  props<{ personName: string }>()
);