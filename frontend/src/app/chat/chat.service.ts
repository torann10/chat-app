import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { CreateRoomBody, Message, Room, RoomMember, User } from 'shared';
import { SocketService } from '../socket/socket.service';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import { tap } from 'rxjs';
import { Store } from '@ngrx/store';
import * as StatsActions from './store/stats.actions';
import * as ChatActions from './store/chat.actions';
import { selectActiveRoomId, selectDirectMessages, selectIsLoadingRooms, selectRooms } from './store/chat.selectors';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private socketService = inject(SocketService);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private store = inject(Store);

  readonly channels = this.store.selectSignal(selectRooms);
  readonly directMessages = this.store.selectSignal(selectDirectMessages);
  readonly isLoadingRooms = this.store.selectSignal(selectIsLoadingRooms);
  readonly activeRoomId = this.store.selectSignal(selectActiveRoomId);

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
        this.store.dispatch(ChatActions.incrementUnread({ roomId: data.roomId }));
      }
    });

    this.socketService.onRoomInvited(() => {
      this.loadRooms();
    });

    this.socketService.onUserStatusChange(({ userId, isOnline }) => {
      this.store.dispatch(ChatActions.updateUserStatus({ userId, isOnline }));

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
        this.store.dispatch(ChatActions.clearChatState());

        this.messages.set([]);
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

  loadRooms(): void {
    this.store.dispatch(ChatActions.loadRooms());
  }

  selectRoom(roomId: number): void {
    this.store.dispatch(StatsActions.incrementRoomsOpened());
    this.store.dispatch(ChatActions.switchRoom({ roomId }));
  }

  createRoom(body: CreateRoomBody) {
    return this.apiService.createRoom(body).pipe(
      tap((room) => {
        this.store.dispatch(ChatActions.addRoom({ room }));
        this.store.dispatch(ChatActions.switchRoom({ roomId: room.id }));
      })
    );
  }

  leaveRoom(roomId: number) {
    return this.apiService.removeMember(roomId, this.currentUserId()).pipe(
      tap(() => {
        this.store.dispatch(ChatActions.removeRoomMembership({ roomId }));
        if (this.activeRoomId() === roomId) {
          const next = this.channels().find((r) => r.id !== roomId && !!r.membership);
          this.store.dispatch(ChatActions.switchRoom({ roomId: next?.id ?? null as any }));
        }
      })
    );
  }

  joinRoom(roomId: number, password?: string) {
    return this.apiService.joinRoom(roomId, password).pipe(
      tap((member) => {
        this.store.dispatch(ChatActions.updateRoomMembership({ 
          roomId, 
          membership: { role: member.role, joinedAt: member.joinedAt } 
        }));
      })
    );
  }

  createDm(user: User) {
    return this.apiService.createRoom({ type: 'dm', userId: user.id }).pipe(
      tap((room) => {
        const dmEntry: Room = { ...room, name: user.fullname ?? user.email, otherUser: user };
        this.store.dispatch(ChatActions.addDm({ dm: dmEntry }));
        this.store.dispatch(ChatActions.switchRoom({ roomId: room.id }));
      })
    );
  }

  private clearUnread(roomId: number): void {
    this.store.dispatch(ChatActions.clearUnread({ roomId }));
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
