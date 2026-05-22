import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatLayoutComponent } from './chat-layout.component';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { ChatService } from '../chat.service';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { MockComponent } from 'ng-mocks';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { CreateDmDialogComponent } from '../create-dm-dialog/create-dm-dialog.component';
import { CreateRoomDialogComponent } from '../create-room-dialog/create-room-dialog.component';
import { JoinRoomDialogComponent } from '../join-room-dialog/join-room-dialog.component';
import { RoomMembersComponent } from '../room-members/room-members.component';
import { By } from '@angular/platform-browser';

describe('ChatLayoutComponent', () => {
  let component: ChatLayoutComponent;
  let fixture: ComponentFixture<ChatLayoutComponent>;
  let mockChatService: any;
  let mockStore: any;

  beforeEach(async () => {
    mockChatService = {
      activeRoom: signal(null),
      messages: signal([]),
      isLoadingMessages: signal(false),
      isLoadingOlderMessages: signal(false),
      activeUsersCount: signal(0),
      currentUserId: signal(1),
      loadOlderMessages: vi.fn(),
      selectRoom: vi.fn(),
      sendMessage: vi.fn(),
      createRoom: vi.fn().mockReturnValue(of({})),
      createDm: vi.fn().mockReturnValue(of({}))
    };

    mockStore = {
      selectSignal: vi.fn().mockImplementation((selector) => {
        return signal([
          { id: 1, name: 'General', membership: true },
          { id: 2, name: 'Private Repo', membership: false }
        ]);
      })
    };

    const mockTranslateService = {
      getBrowserLang: vi.fn().mockReturnValue('en'),
      setDefaultLang: vi.fn(),
      use: vi.fn(),
      instant: vi.fn((key) => key),
      get: vi.fn().mockReturnValue(of('')),
      onLangChange: new Subject(),
      onTranslationChange: new Subject(),
      onDefaultLangChange: new Subject()
    };

    await TestBed.configureTestingModule({
      imports: [ChatLayoutComponent],
      providers: [
        { provide: ChatService, useValue: mockChatService },
        { provide: Store, useValue: mockStore },
        { provide: TranslateService, useValue: mockTranslateService },
      ]
    }).overrideComponent(ChatLayoutComponent, {
      remove: { imports: [
        ChatSidebarComponent, 
        MessageListComponent, 
        ChatHeaderComponent, 
        MessageInputComponent,
        CreateDmDialogComponent,
        CreateRoomDialogComponent,
        JoinRoomDialogComponent,
        RoomMembersComponent
      ] },
      add: { imports: [
        MockComponent(ChatSidebarComponent), 
        MockComponent(MessageListComponent), 
        MockComponent(ChatHeaderComponent), 
        MockComponent(MessageInputComponent),
        MockComponent(CreateDmDialogComponent),
        MockComponent(CreateRoomDialogComponent),
        MockComponent(JoinRoomDialogComponent),
        MockComponent(RoomMembersComponent)
      ] },
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChatLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should toggle and close the sidebar', () => {
    expect((component as any).sidebarOpen()).toBe(false);
    
    (component as any).toggleSidebar();
    expect((component as any).sidebarOpen()).toBe(true);

    (component as any).closeSidebar();
    expect((component as any).sidebarOpen()).toBe(false);
  });

  it('should load older messages when scrolling to the top (first === 0)', () => {
    (component as any).loadMoreMessages({ first: 0, last: 20 });
    expect(mockChatService.loadOlderMessages).toHaveBeenCalled();
  });

  it('should ignore loadMoreMessages if not at the top', () => {
    (component as any).loadMoreMessages({ first: 10, last: 30 });
    expect(mockChatService.loadOlderMessages).not.toHaveBeenCalled();
  });

  it('should instantly select a room if the user is already a member', () => {
    (component as any).selectRoom(1);
    
    expect(mockChatService.selectRoom).toHaveBeenCalledWith(1);
    expect((component as any).sidebarOpen()).toBe(false);
  });

  it('should show the join prompt if the user is NOT a member of the room', () => {
    (component as any).selectRoom(2);
    
    expect(mockChatService.selectRoom).not.toHaveBeenCalled();
    expect((component as any).pendingJoinRoom()?.id).toBe(2);
    expect((component as any).showJoinRoom()).toBe(true);
  });

  it('should join the pending room and close the sidebar', () => {
    (component as any).pendingJoinRoom.set({ id: 2, name: 'Private Repo', membership: false });
    
    (component as any).onRoomJoined();
    
    expect((component as any).pendingJoinRoom()).toBeNull();
    expect(mockChatService.selectRoom).toHaveBeenCalledWith(2);
    expect((component as any).sidebarOpen()).toBe(false);
  });

  it('should send a message via the chat service', () => {
    (component as any).sendMessage('Test message');
    expect(mockChatService.sendMessage).toHaveBeenCalledWith('Test message');
  });

  it('should open and successfully submit the create room modal', () => {
    (component as any).openCreateRoom();
    expect((component as any).showCreateRoom()).toBe(true);

    const mockBody = { name: 'New Room' };
    (component as any).onRoomCreated(mockBody);

    expect(mockChatService.createRoom).toHaveBeenCalledWith(mockBody);
    expect((component as any).showCreateRoom()).toBe(false);
  });

  it('should log an error if creating a DM fails', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockChatService.createDm.mockReturnValueOnce(throwError(() => new Error('Network error')));

    (component as any).onDmCreated({ id: 99, name: 'John' });

    expect(consoleSpy).toHaveBeenCalledWith('[Chat] Failed to create DM:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('should render the backdrop ONLY when the sidebar is open', () => {
    fixture.detectChanges();
    let backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).toBeNull();

    (component as any).sidebarOpen.set(true);
    fixture.detectChanges();
    
    backdrop = fixture.debugElement.query(By.css('.backdrop'));
    expect(backdrop).toBeTruthy(); 
  });

  it('should close the sidebar when the backdrop is clicked', () => {
    (component as any).sidebarOpen.set(true);
    fixture.detectChanges();

    const backdrop = fixture.debugElement.query(By.css('.backdrop'));
    backdrop.triggerEventHandler('click', null);

    expect((component as any).sidebarOpen()).toBe(false);
  });

  it('should apply the "sidebar-closed" CSS class when the sidebar is closed', () => {
    (component as any).sidebarOpen.set(false);
    fixture.detectChanges();

    const sidebar = fixture.debugElement.query(By.css('.sidebar'));
    
    expect(sidebar.classes['sidebar-closed']).toBe(true);

    (component as any).sidebarOpen.set(true);
    fixture.detectChanges();
    expect(sidebar.classes['sidebar-closed']).toBeFalsy();
  });
});

