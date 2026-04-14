import { Component, input } from '@angular/core';
import { Message } from './../../../../shared/index';

@Component({
  selector: 'app-chat-message',
  imports: [],
  templateUrl: './chat-message.component.html',
  styleUrl: './chat-message.component.scss',
})
export class ChatMessageComponent {
  message = input.required<Message>();
}