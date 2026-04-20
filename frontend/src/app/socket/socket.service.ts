import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { io, Socket } from 'socket.io-client';
import { Message } from 'shared';
import { RoomInvitedEvent, UserStatusChangeEvent } from 'shared';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private authService = inject(AuthService);

  private messageCallback: ((data: Message) => void) | null = null;
  private userStatusCallback: ((data: UserStatusChangeEvent) => void) | null = null;
  private roomInvitedCallback: ((data: RoomInvitedEvent) => void) | null = null;

  connect(): void {
    if (this.socket?.connected) return;

    const token = this.authService.getToken();
    this.socket = io('http://localhost:3000', {
      auth: { token },
      autoConnect: true,
    });

    this.socket.on('connect', () => console.log('[Socket] Connected'));
    this.socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    this.socket.on('connect_error', (err) =>
      console.warn('[Socket] Error:', err.message)
    );

    if (this.messageCallback)     this.socket.on('new_message',        this.messageCallback);
    if (this.userStatusCallback)  this.socket.on('user_status_change', this.userStatusCallback);
    if (this.roomInvitedCallback) this.socket.on('room_invited',       this.roomInvitedCallback);
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(data: unknown): void {
    this.socket?.emit('send_message', data);
  }

  onMessage(callback: (data: Message) => void): void {
    this.messageCallback = callback;
    this.socket?.on('new_message', callback);
  }

  onUserStatusChange(callback: (data: UserStatusChangeEvent) => void): void {
    this.userStatusCallback = callback;
    this.socket?.on('user_status_change', callback);
  }

  offUserStatusChange(): void {
    this.userStatusCallback = null;
    this.socket?.off('user_status_change');
  }

  onRoomInvited(callback: (data: RoomInvitedEvent) => void): void {
    this.roomInvitedCallback = callback;
    this.socket?.on('room_invited', callback);
  }
}
