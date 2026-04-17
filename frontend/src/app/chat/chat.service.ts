import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Message, Room } from '../../../../shared';
import { SocketService } from '../socket/socket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
   private socketService = inject(SocketService);

  readonly rooms = signal<Room[]>([
    { id: 1, name: 'general', type: 'channel' },
    { id: 2, name: 'random', type: 'channel' },
    { id: 3, name: 'dev', type: 'channel' },
    { id: 4, name: 'design', type: 'channel' },
    { id: 5, name: 'Alice Johnson', type: 'dm' },
    { id: 6, name: 'Bob Smith', type: 'dm' },
    { id: 7, name: 'Carol White', type: 'dm' },
  ]);

  readonly activeRoomId = signal<number | null>(1);
  readonly messages = signal<Message[]>([]);
  readonly isLoadingMessages = signal(false);
  readonly activeUsersCount = signal(0);
  readonly currentUserId = signal<number>(1);

  readonly channels = computed(() => this.rooms().filter((r) => r.type === 'channel'));
  readonly directMessages = computed(() => this.rooms().filter((r) => r.type === 'dm'));
  readonly activeRoom = computed(() => {
    const id = this.activeRoomId();
    return id !== null ? (this.rooms().find((r) => r.id === id) ?? null) : null;
  });

  constructor() {
    effect(() => {
      const roomId = this.activeRoomId();
      if (roomId !== null) this.loadMessages(roomId);
    });

    this.socketService.connect();
    this.socketService.onMessage((data: any) => {
      const msg: Message = {
        ...data,
        createdAt: new Date(data.createdAt),
        isOwn: data.senderId === this.currentUserId(),
      };
      if (msg.room_id === this.activeRoomId()) {
        this.messages.update((msgs) => [...msgs, msg]);
      } else {
        this.rooms.update((rooms) =>
          rooms.map((r) =>
            r.id === msg.room_id ? { ...r } : r
          )
        );
      }
    });
  }

  selectRoom(roomId: number): void {
    this.activeRoomId.set(roomId);
    this.rooms.update((rooms) =>
      rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
    );
  }

  sendMessage(content: string): void {
    const room = this.activeRoom();
    const trimmed = content.trim();
    if (!room || !trimmed) return;

    const message: Message = {
      id: Date.now(),
      room_id: room.id,
      sender_id: this.currentUserId(),
      content: trimmed,
      created_at: new Date(),
    };

    this.messages.update((msgs) => [...msgs, message]);
    this.socketService.sendMessage({ ...message, created_at: message.created_at.toISOString() });
  }

  private loadMessages(roomId: number): void {
    this.isLoadingMessages.set(true);
    this.messages.set([]);

    const mock: Message[] = [
      {
        id: 1, room_id: 1, sender_id: 2,
        content: 'Hey everyone! 👋',
        created_at: new Date(Date.now() - 3_600_000),
      },
      {
        id: 2, room_id: 1, sender_id: 1,
        content: 'Hi Alice! How are you doing today?',
        created_at: new Date(Date.now() - 3_500_000),
      },
      {
        id: 3, room_id: 1, sender_id: 3,
        content: 'Is anyone working on the authentication PR?',
        created_at: new Date(Date.now() - 1_800_000),
      },
      {
        id: 4, room_id: 1, sender_id: 3,
        content: 'Yes! Just pushed a new commit. Take a look when you get a chance.',
        created_at: new Date(Date.now() - 900_000),
      },
      {
        id: 5, room_id: 1, sender_id: 1,
        content: 'Will do! Thanks for the heads up.',
        created_at: new Date(Date.now() - 600_000),
      },
    ];

    setTimeout(() => {
      this.messages.set(mock);
      this.activeUsersCount.set(Math.floor(Math.random() * 20) + 5);
      this.isLoadingMessages.set(false);
    }, 300);
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }
}
