import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { CreateRoomBody, Message, Room, User } from 'shared';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatService } from '../chat.service';
import { CreateRoomDialogComponent } from "../create-room-dialog/create-room-dialog.component";
import { CreateDmDialogComponent } from "../create-dm-dialog/create-dm-dialog.component";
import { JoinRoomDialogComponent } from "../join-room-dialog/join-room-dialog.component";
import { RoomMembersComponent } from "../room-members/room-members.component";

@Component({
  selector: 'app-chat-layout',
  imports: [
    MessageInputComponent,
    MessageListComponent,
    ChatHeaderComponent,
    ChatSidebarComponent,
    CreateRoomDialogComponent,
    CreateDmDialogComponent,
    JoinRoomDialogComponent,
    RoomMembersComponent
],
  templateUrl: './chat-layout.component.html',
})
export class ChatLayoutComponent {
  protected readonly sidebarOpen = signal(false);
  protected readonly showCreateRoom = signal(false);
  protected readonly showCreateDm = signal(false);

  protected readonly pendingJoinRoom = signal<Room | null>(null);
  protected readonly showJoinRoom = signal(false);
  protected readonly showMembers = signal(false);

  private chatService = inject(ChatService);

  protected readonly channels = this.chatService.channels;
  protected readonly directMessages = this.chatService.directMessages;
  protected readonly activeRoom = this.chatService.activeRoom;
  protected readonly messages = this.chatService.messages;
  protected readonly isLoading = this.chatService.isLoadingMessages;
  protected readonly isLoadingOlderMessages = this.chatService.isLoadingOlderMessages;
  protected readonly activeUsersCount = this.chatService.activeUsersCount;
  protected readonly currentUserId = this.chatService.currentUserId;

  messageListComponent = viewChild(MessageListComponent);

  protected loadMoreMessages(event: { first: number; last: number }) {
    if (event.first === 0) {
      this.chatService.loadOlderMessages();
    }
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected selectRoom(roomId: number): void {
    const room = this.chatService.channels().find((r) => r.id === roomId);
    if (room && !room.membership) {
      this.pendingJoinRoom.set(room);
      this.showJoinRoom.set(true);
      return;
    }

    this.chatService.selectRoom(roomId);
    this.sidebarOpen.set(false);
  }

  protected onRoomJoined(): void {
    const room = this.pendingJoinRoom();
    if (!room) return;
    this.pendingJoinRoom.set(null);
    this.chatService.selectRoom(room.id);
    this.sidebarOpen.set(false);
  }

  protected sendMessage(content: string): void {
    this.chatService.sendMessage(content);
    this.messageListComponent()?.scrollToBottom();
  }

  protected openCreateRoom(): void {
    this.showCreateRoom.set(true);
  }

  protected onRoomCreated(body: CreateRoomBody): void {
    this.chatService.createRoom(body).subscribe({
      next: () => this.showCreateRoom.set(false),
      error: (err) => console.error('[Chat] Failed to create room:', err),
    });
  }

  protected openCreateDm(): void {
    this.showCreateDm.set(true);
  }

  protected onDmCreated(user: User): void {
    this.chatService.createDm(user).subscribe({
      error: (err) => console.error('[Chat] Failed to create DM:', err),
    });
  }
}
