import { Component, computed, inject, input, output, ViewEncapsulation } from '@angular/core';
import { Room } from 'shared';
import { CommonModule } from '@angular/common';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { BadgeModule } from 'primeng/badge';
import { PopoverModule } from 'primeng/popover';
import { AvatarModule } from "primeng/avatar";
import { SidebarUserMenuComponent } from "./sidebar-user-menu/sidebar-user-menu.component";
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-chat-sidebar',
  imports: [
    CommonModule,
    MenuModule,
    BadgeModule,
    TranslatePipe,
    PopoverModule,
    AvatarModule,
    SidebarUserMenuComponent
],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class ChatSidebarComponent {
  rooms = input.required<Room[]>();
  directMessages = input.required<Room[]>();
  activeRoomId = input<number | null>(null);
  
  selectedRoom = output<number>();
  addRoom = output<void>();
  addDm = output<void>();

  private static readonly ROOM_ICON: Record<string, string> = {
    public:   'pi pi-hashtag',
    private:  'pi pi-lock',
    password: 'pi pi-key',
  };

  menuItems = computed<MenuItem[]>(() => [
    {
      label: 'rooms',
      data: { addAction: 'room' },
      items: this.rooms().map((room) => ({
        id: room.id.toString(),
        label: room.name,
        icon: ChatSidebarComponent.ROOM_ICON[room.type] ?? 'pi pi-hashtag',
        badge: room.membership && (room.unreadCount ?? 0) > 0
          ? String(room.unreadCount)
          : undefined,
        data: { isMember: !!room.membership },
        command: () => this.selectedRoom.emit(room.id)
      }))
    },
    {
      label: 'direct_messages',
      data: { addAction: 'dm' },
      items: this.directMessages().map((dm) => ({
        id: dm.id.toString(),
        label: dm.name,
        state: { isOnline: dm.otherUser?.isOnline ?? false },
        badge: (dm.unreadCount ?? 0) > 0 ? String(dm.unreadCount) : undefined,
        command: () => this.selectedRoom.emit(dm.id)
      }))
    }
  ]);

  onAddClick(action: string, event: Event): void {
    event.stopPropagation();
    if (action === 'room') this.addRoom.emit();
    else if (action === 'dm') this.addDm.emit();
  }
}
