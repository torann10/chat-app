import { Component, computed, effect, inject, input, model, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { ChatService } from '../chat.service';
import { Role, Room, RoomMember, User } from 'shared';
import { UserPickerComponent } from '../user-picker/user-picker.component';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { I18NextPipe } from 'angular-i18next';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from 'primeng/tag'; 
import { DrawerModule } from 'primeng/drawer';


const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f59e0b', '#3b82f6',
];

@Component({
  selector: 'app-room-members',
  imports: [
    ButtonModule,
    UserPickerComponent,
    I18NextPipe,
    TooltipModule,
    AvatarModule,
    SkeletonModule,
    TagModule,
    DrawerModule
],
  templateUrl: './room-members.component.html',
  styleUrl: './room-members.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RoomMembersComponent {
  visible = model(false);
  room = input<Room | null>(null);

  private apiService = inject(ApiService);
  private chatService = inject(ChatService);

  readonly currentUserId = this.chatService.currentUserId;
  readonly isAdmin = computed(() => this.room()?.membership?.role === 'admin');

  readonly members = signal<RoomMember[]>([]);
  readonly isLoading = signal(false);
  readonly view = signal<'list' | 'add'>('list');
  readonly actioningId = signal<number | null>(null);

  readonly memberIds = computed(() => this.members().map((m) => m.user.id));
  readonly skeletonRows = Array.from({ length: 5 });

  private picker = viewChild(UserPickerComponent);

  constructor() {
    effect(() => {
      const room = this.room();
      if (this.visible() && room) {
        this.loadMembers(room.id);
      }
      if (!this.visible()) {
        this.view.set('list');
      }
    });
  }

  private loadMembers(roomId: number): void {
    this.isLoading.set(true);
    this.apiService.getMembers(roomId).subscribe({
      next: (members) => {
        this.members.set(members);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  toggleRole(member: RoomMember): void {
    const room = this.room();
    if (!room) return;
    const newRole: Role = member.role === 'admin' ? 'member' : 'admin';
    this.actioningId.set(member.user.id);
    this.apiService.changeMemberRole(room.id, member.user.id, newRole).subscribe({
      next: () => {
        this.members.update((ms) =>
          ms.map((m) => (m.user.id === member.user.id ? { ...m, role: newRole } : m))
        );
        this.actioningId.set(null);
      },
      error: () => this.actioningId.set(null),
    });
  }

  kickMember(member: RoomMember): void {
    const room = this.room();
    if (!room) return;
    this.actioningId.set(member.user.id);
    this.apiService.removeMember(room.id, member.user.id).subscribe({
      next: () => {
        this.members.update((ms) => ms.filter((m) => m.user.id !== member.user.id));
        this.actioningId.set(null);
      },
      error: () => this.actioningId.set(null),
    });
  }

  leaveRoom(): void {
    const room = this.room();
    if (!room) return;
    this.actioningId.set(this.currentUserId());
    this.chatService.leaveRoom(room.id).subscribe({
      next: () => {
        this.actioningId.set(null);
        this.visible.set(false);
      },
      error: () => this.actioningId.set(null),
    });
  }

  addMember(user: User): void {
    const room = this.room();
    if (!room) return;
    this.apiService.addMember(room.id, user.id).subscribe({
      next: (member) => {
        this.members.update((ms) => [...ms, member]);
        this.view.set('list');
      },
      error: () => {},
    });
  }

  showAddView(): void {
    this.view.set('add');
    setTimeout(() => this.picker()?.reset(), 0);
  }

  initials(user: { fullname: string | null; email: string }): string {
    if (user.fullname) {
      return user.fullname
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  }

  avatarStyle(id: number): Record<string, string> {
    return {
      backgroundColor: AVATAR_COLORS[id % AVATAR_COLORS.length],
      color: 'white',
    };
  }
}
