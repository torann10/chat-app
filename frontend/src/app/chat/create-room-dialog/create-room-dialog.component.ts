import { Component, inject, model, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18NEXT_SERVICE, I18NextPipe, ITranslationService } from 'angular-i18next';
import { CreateRoomBody } from 'shared';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { I18NextValidationMessageDirective } from 'angular-i18next/forms';

@Component({
  selector: 'app-create-room-dialog',
  imports: [
    ReactiveFormsModule,
    PasswordModule,
    SelectButtonModule,
    DialogModule,
    ButtonModule,
    I18NextPipe,
    InputTextModule,
    I18NextValidationMessageDirective
  ],
  templateUrl: './create-room-dialog.component.html',
})
export class CreateRoomDialogComponent {
  visible = model(false);

  submitted = output<CreateRoomBody>();

  private fb = inject(FormBuilder);
  private i18next = inject<ITranslationService>(I18NEXT_SERVICE);

  get typeOptions(): { label: string; value: 'public' | 'private' | 'password' }[] {
    return [
      { label: this.i18next.t('room_type_public'),   value: 'public' },
      { label: this.i18next.t('room_type_private'),  value: 'private' },
      { label: this.i18next.t('room_type_password'), value: 'password' },
    ];
  }

  form = this.fb.nonNullable.group({
    type:     ['public' as 'public' | 'private' | 'password'],
    name:     ['', [Validators.required, Validators.maxLength(100)]],
    password: [''],
  });

  get selectedType() {
    return this.form.controls.type.value;
  }

  get canSubmit(): boolean {
    const { name, type, password } = this.form.getRawValue();
    if (!name.trim()) return false;
    if (type === 'password' && !password.trim()) return false;
    return true;
  }

  submit(): void {
    if (!this.canSubmit) return;

    const { type, name, password } = this.form.getRawValue();

    let body: CreateRoomBody;
    if (type === 'password') {
      body = { type: 'password', name: name.trim(), password: password.trim() };
    } else if (type === 'private') {
      body = { type: 'private', name: name.trim() };
    } else {
      body = { type: 'public', name: name.trim() };
    }

    this.submitted.emit(body);
  }

  close(): void {
    this.visible.set(false);
    this.form.reset({ type: 'public', name: '', password: '' });
  }
}
