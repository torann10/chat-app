import { createReducer, on } from "@ngrx/store";
import { StatsState } from "./stats.model";
import * as StatsActions from './stats.actions';

export const initialState: StatsState = {
  statistics: {
    messagesSent: 0,
    roomsOpened: 0,
    interactions: {}
  },
  loading: false,
  error: null
}

export const statsReducer = createReducer(
  initialState,
  on(StatsActions.loadStats, (state) => ({
    ...state,
    loading: true
  })),
  on(StatsActions.loadStatsSuccess, (state, { stats }) => ({
    ...state,
    statistics: stats,
    loading: false
  })),
  on(StatsActions.loadStatsFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  })),
  on(StatsActions.messageSent, (state, { recipient }) => {
    const existingData = state.statistics.interactions[recipient.id];
    const currentCount = existingData ? existingData.messageCount : 0;

    return {
      ...state,
      statistics: {
        ...state.statistics,
        messagesSent: state.statistics.messagesSent + 1,
        interactions: {
          ...state.statistics.interactions,
          [recipient.id]: {
            user: recipient,
            messageCount: currentCount + 1
          }
        }
      }
    };
  }),
  on(StatsActions.incrementRoomsOpened, (state) => ({
    ...state,
    statistics: {
      ...state.statistics,
      roomsOpened: state.statistics.roomsOpened + 1
    }
  })),
  on(StatsActions.messageSent, (state) => ({
    ...state,
    statistics: {
      ...state.statistics,
      messagesSent: state.statistics.messagesSent + 1
    }
  })),
  on(StatsActions.updateFavoritePerson, (state, { personName }) => ({
    ...state,
    statistics: {
      ...state.statistics,
      favoritePerson: personName
    }
  }))
);