import { Component, computed, input, output } from '@angular/core';
import { Room } from '../../../../shared';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, MenuModule, BadgeModule],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss',
})
export class ChatSidebarComponent {
  channels = input.required<Room[]>();
  directMessages = input.required<Room[]>();
  activeRoomId = input<string | null>(null);
  
  selectRoom = output<Room>();

  menuItems = computed<MenuItem[]>(() => [
    {
      label: 'Rooms',
      items: this.channels().map(room => ({
        id: room.id.toString(),
        label: room.name,
        icon: 'pi pi-hashtag',
        badge: 3, //room.unreadCount?.toString(),
        command: () => this.selectRoom.emit(room)
      }))
    },
    {
      label: 'Direct Messages',
      items: this.directMessages().map(dm => ({
        id: dm.id.toString(),
        label: dm.name,
        command: () => this.selectRoom.emit(dm)
      }))
    }
  ]);
}
