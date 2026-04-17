import { Component, computed, inject, input, output } from '@angular/core';
import { Room } from '../../../../../shared';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { I18NextPipe } from 'angular-i18next';
import { Button } from "primeng/button";
import { PopoverModule } from 'primeng/popover';
import { ThemeService } from '../../theme/theme.service';
import { AuthService } from '../../auth/auth.service';
import { AvatarModule } from "primeng/avatar";

@Component({
  selector: 'app-chat-sidebar',
  imports: [
    CommonModule,
    MenuModule,
    BadgeModule,
    I18NextPipe,
    Button,
    PopoverModule,
    AvatarModule
],
  templateUrl: './chat-sidebar.component.html',
})
export class ChatSidebarComponent {
  private authService = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  
  rooms = input.required<Room[]>();
  directMessages = input.required<Room[]>();
  activeRoomId = input<number | null>(null);
  
  selectedRoom = output<number>();

  menuItems = computed<MenuItem[]>(() => [
    {
      label: 'Rooms',
      items: this.rooms().map(room => ({
        id: room.id.toString(),
        label: room.name,
        icon: 'pi pi-hashtag',
        badge: 3, //room.unreadCount?.toString(),
        command: () => this.selectedRoom.emit(room.id)
      }))
    },
    {
      label: 'Direct Messages',
      items: this.directMessages().map(dm => ({
        id: dm.id.toString(),
        label: dm.name,
        command: () => this.selectedRoom.emit(dm.id)
      }))
    }
  ]);

  protected logout(): void {
    this.authService.logout();
  }
}
