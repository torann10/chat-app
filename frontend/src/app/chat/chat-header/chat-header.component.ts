import { Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Room } from '../../../../../shared';
import { AvatarModule } from 'primeng/avatar';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-header',
  imports: [
    ButtonModule,
    TranslatePipe,
    TooltipModule,
    AvatarModule
  ],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  room = input.required<Room | null>();
  activeUsersCount = input<number>(0);
  
  toggleSidebar = output<void>();
  openMembers = output<void>();
}
