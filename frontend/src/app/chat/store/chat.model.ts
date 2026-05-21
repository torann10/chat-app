import { Room } from "shared";

export interface ChatState {
  rooms: Room[];
  directMessages: Room[];
  activeRoomId: number | null;
  loadingRooms: boolean;
}