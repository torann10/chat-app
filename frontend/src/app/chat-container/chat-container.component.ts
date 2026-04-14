import { Component, computed, signal, viewChild } from '@angular/core';
import { MessageInputComponent } from '../message-input/message-input.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { Message, Room } from '../../../../shared';

@Component({
  selector: 'app-chat-container',
  imports: [MessageInputComponent, MessageListComponent, ChatHeaderComponent],
  templateUrl: './chat-container.component.html',
  styleUrl: './chat-container.component.scss',
})
export class ChatContainerComponent {
  isMobileMenuOpen = false;

  rooms = signal<Room[]>([]);
  messages = signal<Message[]>([]);
  activeRoom = signal<Room | null>(this.rooms()[0]);

  channels = computed(() => this.rooms().filter(r => r.type === 'channel'));
  directMessages = computed(() => this.rooms().filter(r => r.type === 'dm'));
  currentMessages = computed(() => this.messages());

  messageListComponent = viewChild(MessageListComponent);

  switchRoom(room: Room) {
    this.activeRoom.set(room);
    this.isMobileMenuOpen = false;

    this.messageListComponent()?.scrollToBottom();
  }

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
}
