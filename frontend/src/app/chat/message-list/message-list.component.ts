import { CommonModule } from '@angular/common';
import { Component, input, output, viewChild } from '@angular/core';
import { Message } from '../../../../../shared';
import { ScrollerLazyLoadEvent, Scroller, ScrollerModule } from 'primeng/scroller';
import { MessageItem } from '../message-item/message-item.component';
import { I18NextPipe } from 'angular-i18next';

@Component({
  selector: 'app-message-list',
  imports: [
    CommonModule, 
    ScrollerModule, 
    MessageItem,
    I18NextPipe
  ],
  templateUrl: './message-list.component.html',
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
