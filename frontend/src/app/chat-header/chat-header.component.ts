import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-chat-header',
  imports: [ButtonModule],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  roomName = input.required<string>();
  activeUsersCount = input.required<number>();
  
  toggleMenu = output<void>();
}
