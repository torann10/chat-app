import { Component, computed, inject, input } from '@angular/core';
import { Message } from 'shared';
import { I18NextPipe } from 'angular-i18next';
import { DatePipe } from '@angular/common';
import { AvatarModule } from "primeng/avatar";
import { AuthService } from '../../auth/auth.service';


@Component({
  selector: 'app-message-item',
  imports: [
    DatePipe,
    AvatarModule
],
  templateUrl: './message-item.component.html',
})
export class MessageItem {
  message = input.required<Message>();
  showSender = input<boolean>(true);

  private authService = inject(AuthService);
  readonly currentUserId = computed(() => this.authService.currentUser()?.id ?? -1);
}
