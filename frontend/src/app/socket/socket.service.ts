import { inject, Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | null = null;
  private authService = inject(AuthService);

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
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  sendMessage(data: unknown): void {
    this.socket?.emit('send_message', data);
  }

  onMessage(callback: (data: any) => void): void {
    this.socket?.on('receive_message', callback);
  }
}
