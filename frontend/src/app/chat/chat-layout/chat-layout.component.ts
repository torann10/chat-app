import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { Message, Room } from '../../../../../shared';
import { ChatSidebarComponent } from '../chat-sidebar/chat-sidebar.component';
import { ChatService } from '../chat.service';

@Component({
  selector: 'app-chat-layout',
  imports: [
    MessageInputComponent, 
    MessageListComponent, 
    ChatHeaderComponent,
    ChatSidebarComponent
  ],
  templateUrl: './chat-layout.component.html',
})
export class ChatLayoutComponent {
  protected readonly sidebarOpen = signal(false);

  private chatService = inject(ChatService);

  protected readonly channels = this.chatService.channels;
  protected readonly directMessages = this.chatService.directMessages;
  protected readonly activeRoom = this.chatService.activeRoom;
  protected readonly messages = this.chatService.messages;
  protected readonly isLoading = this.chatService.isLoadingMessages;
  protected readonly activeUsersCount = this.chatService.activeUsersCount;

  rooms = signal<Room[]>([]);
  
  
  currentMessages = computed(() => this.messages());

  messageListComponent = viewChild(MessageListComponent);

  onSendMessage(content: string) {
    const newMessage: Message = {
      id: Math.random(),
      room_id: 0,
      sender_id: 0,
      content,
      created_at: new Date(),
    };
    
    this.messages.update(msgs => [...msgs, newMessage]);

    this.messageListComponent()?.scrollToBottom();
  }

  isLoadingOlder = signal(false);
  isLoadingNewer = signal(false);

  loadMoreMessages(event: { first: number; last: number }) {
    const currentMsgCount = this.messages().length;
    
    if (this.isLoadingOlder() || this.isLoadingNewer()) return;

    if (event.first === 0 && currentMsgCount > 0) {
      this.isLoadingOlder.set(true);

      setTimeout(() => {
        const olderMessages: Message[] = [];

        this.messages.update(msgs => [...olderMessages, ...msgs]);
        this.isLoadingOlder.set(false);
      }, 1500);
    } else if (event.last >= currentMsgCount && currentMsgCount > 0) {
      this.isLoadingNewer.set(true);

      setTimeout(() => {
        const newerMessages: Message[] = [];

        this.messages.update(msgs => [...msgs, ...newerMessages]);
        this.isLoadingNewer.set(false);
      }, 1500);
    }
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected selectRoom(roomId: number): void {
    this.chatService.selectRoom(roomId);
    this.sidebarOpen.set(false);
  }

  protected sendMessage(content: string): void {
    this.chatService.sendMessage(content);
  }
}
