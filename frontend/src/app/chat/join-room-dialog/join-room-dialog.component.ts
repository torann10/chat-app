import { Component, inject, input, model, output, signal, ViewEncapsulation } from '@angular/core';
import { DialogModule } from "primeng/dialog";
import { PasswordModule } from "primeng/password";
import { ButtonModule } from "primeng/button";
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ChatService } from '../chat.service';
import { Room } from 'shared';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-join-room-dialog',
  imports: [
    ReactiveFormsModule,
    TranslatePipe,
    DialogModule, 
    PasswordModule, 
    ButtonModule
  ],
  templateUrl: './join-room-dialog.component.html',
  styleUrl: './join-room-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class JoinRoomDialogComponent {
  room = input<Room | null>(null);
  visible = model(false);
  joined = output<void>();

  private chatService = inject(ChatService);
  private fb = inject(FormBuilder);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({ password: [''] });

  get isPasswordRoom(): boolean {
    return this.room()?.type === 'password';
  }

  get memberCount(): number {
    return this.room()?._count?.members ?? 0;
  }

  get canSubmit(): boolean {
    return !this.isPasswordRoom || !!this.form.controls.password.value.trim();
  }

  submit(): void {
    const room = this.room();
    if (!room || this.isLoading() || !this.canSubmit) return;

    this.error.set(null);
    this.isLoading.set(true);

    const password = this.isPasswordRoom
      ? this.form.controls.password.value.trim()
      : undefined;

    this.chatService.joinRoom(room.id, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.joined.emit();
        this.close();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.error?.error ?? 'error.join_failed');
      },
    });
  }

  close(): void {
    this.visible.set(false);
    this.form.reset();
    this.error.set(null);
  }
}
