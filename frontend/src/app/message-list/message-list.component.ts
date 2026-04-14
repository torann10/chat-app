import { CommonModule } from '@angular/common';
import { Component, input, output, viewChild } from '@angular/core';
import { Message } from './../../../../shared/index';
import { ScrollerLazyLoadEvent, Scroller, ScrollerModule } from 'primeng/scroller';
import { ChatMessageComponent } from '../chat-message/chat-message.component';

@Component({
  selector: 'app-message-list',
  imports: [
    CommonModule, ScrollerModule, ChatMessageComponent
  ],
  templateUrl: './message-list.component.html',
  styleUrl: './message-list.component.scss',
})
export class MessageListComponent {
  messages = input.required<Message[]>();
  isLoadingTop = input.required<boolean>();
  isLoadingBottom = input.required<boolean>();
  
  fetchMessages = output<{ first: number; last: number }>();

  scrollerRef = viewChild<Scroller>('scroller');

  onScrollLoad(event: ScrollerLazyLoadEvent) {
    this.fetchMessages.emit({ first: event.first, last: event.last });
  }

  scrollToBottom() {
    setTimeout(() => {
      const lastIndex = this.messages().length - 1;
      if (lastIndex >= 0) {
        this.scrollerRef()?.scrollToIndex(lastIndex);
      }
    });
  }
}
