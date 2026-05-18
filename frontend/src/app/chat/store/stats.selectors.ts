import { createFeatureSelector, createSelector } from "@ngrx/store";
import { StatsState, UsageStatistics } from "./stats.model";

export const selectStatsState = createFeatureSelector<StatsState>('stats');

export const selectUsageStatistics = createSelector(
  selectStatsState,
  (state: StatsState) => state.statistics
);

export const selectFavoritePerson = createSelector(
  selectUsageStatistics,
  (stats: UsageStatistics) => {
    const allInteractions = Object.values(stats.interactions);

    if (allInteractions.length === 0) return null;

    const topInteraction = allInteractions.reduce((top, current) => 
      current.messageCount > top.messageCount ? current : top
    );

    return topInteraction.user;
  }
);

export const selectIsLoadingStats = createSelector(
  selectStatsState,
  (state: StatsState) => state.loading
);