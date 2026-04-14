import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-message-input',
  imports: [ButtonModule, InputTextModule, FormsModule],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
})
export class MessageInputComponent {
  messageText = signal('');
  sendMessage = output<string>();

  onSubmit() {
    if (this.messageText().trim()) {
      this.sendMessage.emit(this.messageText());
      this.messageText.set('');
    }
  }
}
