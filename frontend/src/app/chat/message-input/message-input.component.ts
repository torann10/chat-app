import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-message-input',
  imports: [
    ButtonModule, 
    InputTextModule, 
    FormsModule,
    TranslatePipe
  ],
  templateUrl: './message-input.component.html',
  styleUrl: './message-input.component.scss',
})
export class MessageInputComponent {
  protected readonly messageText = signal('');
  sendMessage = output<string>();

  submit(): void {
    const text = this.messageText().trim();
    if (text) {
      this.sendMessage.emit(text);
      this.messageText.set('');
    }
  }
}
