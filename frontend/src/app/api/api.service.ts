import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CreateRoomBody, ListMessagesResponse, ListUsersResponse, Message, Room, RoomMember } from 'shared';

const BASE = 'http://localhost:3000';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);

  getRooms(type: 'room' | 'dm') {
    return this.http.get<Room[]>(`${BASE}/rooms`, { params: { type } });
  }

  createRoom(body: CreateRoomBody) {
    return this.http.post<Room>(`${BASE}/rooms`, body);
  }

  getUsers(query: { search?: string; page?: number; limit?: number } = {}) {
    let params = new HttpParams();
    if (query.search) params = params.set('search', query.search);
    if (query.page)   params = params.set('page', query.page);
    if (query.limit)  params = params.set('limit', query.limit);
    return this.http.get<ListUsersResponse>(`${BASE}/users`, { params });
  }

  getMessages(roomId: number, query: { cursor?: number; limit?: number } = {}) {
    let params = new HttpParams();
    if (query.cursor) params = params.set('cursor', query.cursor);
    if (query.limit)  params = params.set('limit', query.limit);
    return this.http.get<ListMessagesResponse>(`${BASE}/rooms/${roomId}/messages`, { params });
  }

  sendMessage(roomId: number, content: string) {
    return this.http.post<Message>(`${BASE}/rooms/${roomId}/messages`, { content });
  }

  markRoomAsRead(roomId: number) {
    return this.http.post<void>(`${BASE}/rooms/${roomId}/read`, {});
  }

  joinRoom(roomId: number, password?: string) {
    return this.http.post<RoomMember>(
      `${BASE}/rooms/${roomId}/members`,
      password ? { password } : {},
    );
  }

  getMembers(roomId: number) {
    return this.http.get<RoomMember[]>(`${BASE}/rooms/${roomId}/members`);
  }

  addMember(roomId: number, userId: number) {
    return this.http.post<RoomMember>(`${BASE}/rooms/${roomId}/members`, { userId });
  }

  removeMember(roomId: number, userId: number) {
    return this.http.delete<void>(`${BASE}/rooms/${roomId}/members/${userId}`);
  }

  changeMemberRole(roomId: number, userId: number, role: 'admin' | 'member') {
    return this.http.patch<void>(`${BASE}/rooms/${roomId}/members/${userId}`, { role });
  }
}
