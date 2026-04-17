import { Component, input } from '@angular/core';
import { Message } from '../../../../../shared';
import { I18NextPipe } from 'angular-i18next';
import { DatePipe } from '@angular/common';
import { AvatarModule } from "primeng/avatar";


@Component({
  selector: 'app-message-item',
  imports: [
    I18NextPipe,
    DatePipe,
    AvatarModule
],
  templateUrl: './message-item.component.html',
})
export class MessageItem {
  message = input.required<Message>();
  showSender = input<boolean>(true);
}
