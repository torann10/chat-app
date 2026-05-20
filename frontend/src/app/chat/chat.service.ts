import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { CreateRoomBody, Message, Room, RoomMember, User } from 'shared';
import { SocketService } from '../socket/socket.service';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { tap } from 'rxjs';
import { Store } from '@ngrx/store';
import * as StatsActions from './store/stats.actions';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socketService = inject(SocketService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private store = inject(Store);

  readonly channels = signal<Room[]>([]);
  readonly directMessages = signal<Room[]>([]);
  readonly isLoadingRooms = signal(false);

  readonly activeRoomId = signal<number | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly isLoadingMessages = signal(false);
  readonly isLoadingOlderMessages = signal(false);
  readonly roomMembers = signal<RoomMember[]>([]);

  readonly activeUsersCount = computed(() => {
    const members = this.roomMembers();
    
    return members.filter(member => member.user.isOnline === true).length;
  });

  private readonly nextCursor = signal<number | null>(null);
  readonly hasMoreMessages = computed(() => this.nextCursor() !== null);

  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? 0);

  readonly activeRoom = computed(() => {
    const id = this.activeRoomId();
    if (id === null) return null;
    return (
      this.channels().find((r) => r.id === id) ??
      this.directMessages().find((r) => r.id === id) ??
      null
    );
  });

  constructor() {
    this.socketService.onMessage((data: Message) => {
      if (data.senderId === this.currentUserId()) return;

      if (data.roomId === this.activeRoomId()) {
        this.messages.update((msgs) => [...msgs, data]);
      } else {
        this.channels.update((rooms) =>
          rooms.map((r) =>
            r.id === data.roomId && r.membership
              ? { ...r, unreadCount: (r.unreadCount ?? 0) + 1 }
              : r
          )
        );
        this.directMessages.update((dms) =>
          dms.map((dm) =>
            dm.id === data.roomId
              ? { ...dm, unreadCount: (dm.unreadCount ?? 0) + 1 }
              : dm
          )
        );
      }
    });

    this.socketService.onRoomInvited(() => {
      this.loadRooms();
    });

    this.socketService.onUserStatusChange(({ userId, isOnline }) => {
      this.directMessages.update((dms) =>
        dms.map((dm) =>
          dm.otherUser?.id === userId
            ? { ...dm, otherUser: { ...dm.otherUser!, isOnline } }
            : dm
        )
      );

      this.roomMembers.update((members) => 
        members.map((member) => 
          member.user.id === userId 
            ? { ...member, user: { ...member.user, isOnline } }
            : member
        )
      );
    });

    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.socketService.reconnect();
        this.loadRooms();
      } else {
        this.channels.set([]);
        this.directMessages.set([]);
        this.messages.set([]);
        this.activeRoomId.set(null);
        this.nextCursor.set(null);
        this.socketService.disconnect();
      }
    });

    effect(() => {
      const roomId = this.activeRoomId();
      if (roomId !== null) {
        this.loadMessages(roomId);
        this.loadRoomMembers(roomId);
      }
    });
  }

  private loadRooms(): void {
    this.isLoadingRooms.set(true);

    this.apiService.getRooms('room').subscribe({
      next: (rooms) => {
        this.channels.set(rooms);
        if (rooms.length > 0 && this.activeRoomId() === null) {
          this.activeRoomId.set(rooms[0].id);
        }
      },
      error: (err) => console.error('[Chat] Failed to load rooms:', err),
    });

    this.apiService.getRooms('dm').subscribe({
      next: (dms) => {
        this.directMessages.set(dms);
        this.isLoadingRooms.set(false);
      },
      error: (err) => {
        console.error('[Chat] Failed to load DMs:', err);
        this.isLoadingRooms.set(false);
      },
    });
  }

  selectRoom(roomId: number): void {
    this.store.dispatch(StatsActions.incrementRoomsOpened());
    this.activeRoomId.set(roomId);
  }

  createRoom(body: CreateRoomBody) {
    return this.apiService.createRoom(body).pipe(
      tap((room) => {
        this.channels.update((rooms) => [...rooms, room]);
        this.activeRoomId.set(room.id);
      })
    );
  }

  leaveRoom(roomId: number) {
    return this.apiService.removeMember(roomId, this.currentUserId()).pipe(
      tap(() => {
        this.channels.update((rooms) =>
          rooms.map((r) => (r.id === roomId ? { ...r, membership: null } : r))
        );
        if (this.activeRoomId() === roomId) {
          const next = this.channels().find((r) => r.id !== roomId && !!r.membership);
          this.activeRoomId.set(next?.id ?? null);
        }
      })
    );
  }

  joinRoom(roomId: number, password?: string) {
    return this.apiService.joinRoom(roomId, password).pipe(
      tap((member) => {
        this.channels.update((rooms) =>
          rooms.map((r) =>
            r.id === roomId
              ? { ...r, membership: { role: member.role, joinedAt: member.joinedAt } }
              : r
          )
        );
      })
    );
  }

  createDm(user: User) {
    return this.apiService.createRoom({ type: 'dm', userId: user.id }).pipe(
      tap((room) => {
        const existing = this.directMessages().find((d) => d.id === room.id);
        if (!existing) {
          const dmEntry: Room = {
            ...room,
            name: user.fullname ?? user.email,
            otherUser: user,
          };
          this.directMessages.update((dms) => [dmEntry, ...dms]);
        }
        this.activeRoomId.set(room.id);
      })
    );
  }

  private clearUnread(roomId: number): void {
    this.channels.update((rooms) =>
      rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
    );
    this.directMessages.update((dms) =>
      dms.map((dm) => (dm.id === roomId ? { ...dm, unreadCount: 0 } : dm))
    );
  }

  sendMessage(content: string): void {
    const room = this.activeRoom();
    const trimmed = content.trim();
    if (!room || !trimmed) return;

    const userId = this.currentUserId();
    const currentUser = this.authService.currentUser();

    const tempId = -Date.now();
    const optimistic: Message = {
      id: tempId,
      roomId: room.id,
      senderId: userId,
      content: trimmed,
      createdAt: new Date().toISOString(),
      sender: { id: userId, email: currentUser?.email ?? '', fullname: null },
    };

    this.messages.update((msgs) => [...msgs, optimistic]);

    const recipientUser: User | null = room.otherUser!;

    this.store.dispatch(StatsActions.messageSent({ recipient: recipientUser }));

    this.apiService.sendMessage(room.id, trimmed).subscribe({
      next: (confirmed) => {
        this.messages.update((msgs) =>
          msgs.map((m) => (m.id === tempId ? confirmed : m))
        );
      },
      error: () => {
        this.messages.update((msgs) => msgs.filter((m) => m.id !== tempId));
      },
    });  
  }

  private loadMessages(roomId: number): void {
    this.clearUnread(roomId);
    this.apiService.markRoomAsRead(roomId).subscribe();

    this.isLoadingMessages.set(true);
    this.messages.set([]);
    this.nextCursor.set(null);

    this.apiService.getMessages(roomId, { limit: 50 }).subscribe({
      next: ({ messages, nextCursor }) => {
        this.messages.set(messages);
        this.nextCursor.set(nextCursor);
        this.isLoadingMessages.set(false);
      },
      error: (err) => {
        console.error('[Chat] Failed to load messages:', err);
        this.isLoadingMessages.set(false);
      },
    });
  }

  private loadRoomMembers(roomId: number): void {
    this.apiService.getMembers(roomId).subscribe({
      next: (members) => {
        this.roomMembers.set(members); 
      },
      error: (err) => console.error('[Chat] Failed to load members:', err),
    });
  }

  loadOlderMessages(): void {
    const roomId = this.activeRoomId();
    const cursor = this.nextCursor();
    if (!roomId || cursor === null || this.isLoadingOlderMessages()) return;

    this.isLoadingOlderMessages.set(true);

    this.apiService.getMessages(roomId, { cursor, limit: 50 }).subscribe({
      next: ({ messages, nextCursor }) => {
        this.messages.update((current) => [...messages, ...current]);
        this.nextCursor.set(nextCursor);
        this.isLoadingOlderMessages.set(false);
      },
      error: (err) => {
        console.error('[Chat] Failed to load older messages:', err);
        this.isLoadingOlderMessages.set(false);
      },
    });
  }

  ngOnDestroy(): void {
    this.socketService.offUserStatusChange();
    this.socketService.disconnect();
  }
}
