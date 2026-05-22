import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { Store } from '@ngrx/store';
import { ChatService } from './chat.service';
import { SocketService } from '../socket/socket.service';
import { ApiService } from '../api/api.service';
import { AuthService } from '../auth/auth.service';
import * as ChatActions from './store/chat.actions';

describe('ChatService', () => {
  let service: ChatService;
  let mockSocketService: any;
  let mockApiService: any;
  let mockAuthService: any;
  let mockStore: any;

  let mockRoomsSignal: any;
  let mockDmsSignal: any;
  let mockActiveRoomIdSignal: any;

  let socketCallbacks: Record<string, Function> = {};

  beforeEach(() => {
    socketCallbacks = {};

    mockSocketService = {
      onMessage: vi.fn((cb) => (socketCallbacks['onMessage'] = cb)),
      onRoomInvited: vi.fn((cb) => (socketCallbacks['onRoomInvited'] = cb)),
      onUserStatusChange: vi.fn((cb) => (socketCallbacks['onUserStatusChange'] = cb)),
      reconnect: vi.fn(),
      disconnect: vi.fn(),
      offUserStatusChange: vi.fn()
    };

    mockApiService = {
      createRoom: vi.fn(),
      removeMember: vi.fn(),
      joinRoom: vi.fn(),
      sendMessage: vi.fn(),
      getMessages: vi.fn().mockReturnValue(of({ messages: [], nextCursor: null })),
      getMembers: vi.fn().mockReturnValue(of([])),
      markRoomAsRead: vi.fn().mockReturnValue(of({}))
    };

    mockAuthService = {
      currentUser: signal({ id: 1, email: 'test@test.com', fullname: 'Test User' })
    };

    mockRoomsSignal = signal([{ id: 10, name: 'General' }]);
    mockDmsSignal = signal([]);
    mockActiveRoomIdSignal = signal<number | null>(null);

    mockStore = {
      dispatch: vi.fn(),
      selectSignal: vi.fn()
        .mockReturnValueOnce(mockRoomsSignal)
        .mockReturnValueOnce(mockDmsSignal)
        .mockReturnValueOnce(signal(false))
        .mockReturnValueOnce(mockActiveRoomIdSignal)
    };

    TestBed.configureTestingModule({
      providers: [
        ChatService,
        { provide: SocketService, useValue: mockSocketService }, 
        { provide: ApiService, useValue: mockApiService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Store, useValue: mockStore }
      ]
    });

    service = TestBed.inject(ChatService);
  });

  describe('Initialization and Computed Signals', () => {
    it('should calculate activeUsersCount correctly', () => {
      service.roomMembers.set([
        { user: { id: 2, isOnline: true } } as any,
        { user: { id: 3, isOnline: false } } as any,
      ]);

      expect(service.activeUsersCount()).toBe(1);
    });

    it('should determine activeRoom based on activeRoomId', () => {
      expect(service.activeRoom()).toBeNull();

      mockActiveRoomIdSignal.set(10);

      expect(service.activeRoom()?.name).toBe('General');
    });
  });

  describe('Actions and API Calls', () => {
    it('should dispatch actions when selecting a room', () => {
      service.selectRoom(10);
      expect(mockStore.dispatch).toHaveBeenCalledTimes(2);
      expect(mockStore.dispatch).toHaveBeenCalledWith(ChatActions.switchRoom({ roomId: 10 }));
    });

    it('should call apiService and dispatch when creating a room', () => {
      const mockRoom = { id: 99, name: 'New Room' };
      mockApiService.createRoom.mockReturnValue(of(mockRoom));

      service.createRoom({ name: 'New Room' } as any).subscribe();

      expect(mockApiService.createRoom).toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalledTimes(2);
    });

    it('should reconnect and load rooms when a user logs in', () => {
      TestBed.tick();

      expect(mockSocketService.reconnect).toHaveBeenCalled();
      expect(mockStore.dispatch).toHaveBeenCalled();
    });

    it('should clear state and disconnect when a user logs out', () => {
      mockAuthService.currentUser.set(null);
      
      TestBed.tick();

      expect(mockStore.dispatch).toHaveBeenCalled();
      expect(service.messages()).toEqual([]);
      expect((service as any).nextCursor()).toBeNull();
      expect(mockSocketService.disconnect).toHaveBeenCalled();
    });

    it('should load messages and members when activeRoomId changes', () => {
      const loadMessagesSpy = vi.spyOn(service as any, 'loadMessages').mockImplementation(() => {});
      const loadMembersSpy = vi.spyOn(service as any, 'loadRoomMembers').mockImplementation(() => {});
      
      mockActiveRoomIdSignal.set(10);
      TestBed.tick();

      expect(loadMessagesSpy).toHaveBeenCalledWith(10);
      expect(loadMembersSpy).toHaveBeenCalledWith(10);
    });
    it('should leave a room and switch to the next available room', () => {
      mockApiService.removeMember.mockReturnValue(of({}));
      mockActiveRoomIdSignal.set(10);
      mockRoomsSignal.set([
        { id: 10, name: 'General', membership: true },
        { id: 20, name: 'Other', membership: true }
      ]);

      service.leaveRoom(10).subscribe();

      expect(mockApiService.removeMember).toHaveBeenCalledWith(10, 1);
      expect(mockStore.dispatch).toHaveBeenCalledTimes(2);
    });

    it('should join a room and update membership', () => {
      mockApiService.joinRoom.mockReturnValue(of({ role: 'member', joinedAt: '2024-01-01' }));
      
      service.joinRoom(99, 'password123').subscribe();

      expect(mockApiService.joinRoom).toHaveBeenCalledWith(99, 'password123');
      expect(mockStore.dispatch).toHaveBeenCalled();
    });

    it('should create a DM, format the entry, and switch to it', () => {
      mockApiService.createRoom.mockReturnValue(of({ id: 50, type: 'dm' }));
      const otherUser = { id: 2, fullname: 'Jane Doe', email: 'jane@test.com' } as any;

      service.createDm(otherUser).subscribe();

      expect(mockApiService.createRoom).toHaveBeenCalledWith({ type: 'dm', userId: 2 });
      expect(mockStore.dispatch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Optimistic Message Sending', () => {
    it('should add message optimistically and update on success', () => {
      (service as any).activeRoom = signal({ id: 10, otherUser: null });

      const confirmMessage = { id: 500, content: 'Hello' };
      mockApiService.sendMessage.mockReturnValue(of(confirmMessage));

      service.sendMessage('Hello');

      expect(mockApiService.sendMessage).toHaveBeenCalledWith(10, 'Hello');
      
      expect(service.messages().length).toBe(1);
      expect(service.messages()[0].id).toBe(500); 
    });

    it('should revert the optimistic message if the API fails', () => {
      (service as any).activeRoom = signal({ id: 10, otherUser: null });

      mockApiService.sendMessage.mockReturnValue(throwError(() => new Error('Failed')));

      service.sendMessage('Hello');

      expect(service.messages().length).toBe(0);
    });

    it('should not send empty messages', () => {
      (service as any).activeRoom = signal({ id: 10, otherUser: null });

      service.sendMessage('   ');
      
      expect(mockApiService.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Socket Events', () => {
    it('should append message if it belongs to the active room', () => {
      (service as any).activeRoomId = signal(10);
      
      const incomingMessage = { id: 1, roomId: 10, senderId: 2, content: 'Hi' } as any;
      
      socketCallbacks['onMessage'](incomingMessage);

      expect(service.messages().length).toBe(1);
      expect(service.messages()[0]).toEqual(incomingMessage);
    });

    it('should dispatch incrementUnread if message is for a different room', () => {
      (service as any).activeRoomId = signal(10);
      
      const incomingMessage = { id: 1, roomId: 99, senderId: 2, content: 'Hi' } as any;
      
      socketCallbacks['onMessage'](incomingMessage);

      expect(service.messages().length).toBe(0);
      expect(mockStore.dispatch).toHaveBeenCalled(); 
    });

    it('should load rooms when invited to a new room', () => {
      const loadRoomsSpy = vi.spyOn(service, 'loadRooms');

      socketCallbacks['onRoomInvited']();

      expect(loadRoomsSpy).toHaveBeenCalled();
    });

    it('should update user status and room members when a user comes online', () => {
      service.roomMembers.set([{ user: { id: 5, isOnline: false } } as any]);

      socketCallbacks['onUserStatusChange']({ userId: 5, isOnline: true });

      expect(mockStore.dispatch).toHaveBeenCalled();

      const members = service.roomMembers();
      expect(members[0].user.isOnline).toBe(true);
    });
  });

  describe('Data Loading and Pagination', () => {
    it('should load messages and set the cursor', () => {
      mockApiService.getMessages.mockReturnValue(of({ 
        messages: [{ id: 1, content: 'Test' }], 
        nextCursor: 123 
      }));

      (service as any).loadMessages(10);

      expect(mockStore.dispatch).toHaveBeenCalled();
      expect(mockApiService.markRoomAsRead).toHaveBeenCalledWith(10);
      expect(service.messages().length).toBe(1);
      expect((service as any).nextCursor()).toBe(123);
      expect(service.isLoadingMessages()).toBe(false);
    });

    it('should handle errors when loading messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApiService.getMessages.mockReturnValue(throwError(() => new Error('API Error')));

      (service as any).loadMessages(10);

      expect(consoleSpy).toHaveBeenCalledWith('[Chat] Failed to load messages:', expect.any(Error));
      expect(service.isLoadingMessages()).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should load room members', () => {
      mockApiService.getMembers.mockReturnValue(of([{ user: { id: 1 } }]));
      
      (service as any).loadRoomMembers(10);
      
      expect(service.roomMembers().length).toBe(1);
    });

    it('should handle errors when loading room members', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockApiService.getMembers.mockReturnValue(throwError(() => new Error('API Error')));

      (service as any).loadRoomMembers(10);

      expect(consoleSpy).toHaveBeenCalledWith('[Chat] Failed to load members:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should load older messages and prepend them to the list', () => {
      mockActiveRoomIdSignal.set(10);
      (service as any).nextCursor.set(50);
      service.messages.set([{ id: 2, content: 'Recent' }] as any);
      
      mockApiService.getMessages.mockReturnValue(of({ 
        messages: [{ id: 1, content: 'Old' }], 
        nextCursor: 20 
      }));

      service.loadOlderMessages();

      expect(service.messages()[0].id).toBe(1);
      expect(service.messages()[1].id).toBe(2);
      expect((service as any).nextCursor()).toBe(20);
      expect(service.isLoadingOlderMessages()).toBe(false);
    });

    it('should handle errors when loading older messages', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockActiveRoomIdSignal.set(10);
      (service as any).nextCursor.set(50);
      mockApiService.getMessages.mockReturnValue(throwError(() => new Error('API Error')));

      service.loadOlderMessages();

      expect(consoleSpy).toHaveBeenCalledWith('[Chat] Failed to load older messages:', expect.any(Error));
      expect(service.isLoadingOlderMessages()).toBe(false);
      consoleSpy.mockRestore();
    });

    it('should abort loadOlderMessages if no room, no cursor, or already loading', () => {
      mockApiService.getMessages.mockClear();
      
      service.isLoadingOlderMessages.set(true);
      service.loadOlderMessages();
      expect(mockApiService.getMessages).not.toHaveBeenCalled();
      service.isLoadingOlderMessages.set(false);

      (service as any).nextCursor.set(null);
      service.loadOlderMessages();
      expect(mockApiService.getMessages).not.toHaveBeenCalled();
    });
  });
});