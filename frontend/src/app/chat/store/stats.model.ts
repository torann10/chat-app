import { User } from "shared";

export interface UserInteraction {
  user: User;
  messageCount: number;
}

export interface UsageStatistics {
  messagesSent: number;
  roomsOpened: number;
  interactions: Record<number, UserInteraction>;
}

export interface StatsState {
  statistics: UsageStatistics;
  loading: boolean;
  error: any;
}