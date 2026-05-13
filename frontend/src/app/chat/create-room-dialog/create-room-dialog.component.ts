import { Component, inject, model, output, ViewEncapsulation } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateRoomBody } from 'shared';
import { PasswordModule } from 'primeng/password';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-create-room-dialog',
  imports: [
    ReactiveFormsModule,
    PasswordModule,
    SelectButtonModule,
    DialogModule,
    ButtonModule,
    TranslatePipe,
    InputTextModule,
  ],
  templateUrl: './create-room-dialog.component.html',
  styleUrl: './create-room-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CreateRoomDialogComponent {
  visible = model(false);

  submitted = output<CreateRoomBody>();

  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  get typeOptions(): { label: string; value: 'public' | 'private' | 'password' }[] {
    return [
      { label: this.translate.instant('app.room_type_public'), value: 'public' },
      { label: this.translate.instant('app.room_type_private'), value: 'private' },
      { label: this.translate.instant('app.room_type_password'), value: 'password' },
    ];
  }

  form = this.fb.nonNullable.group({
    type: ['public' as 'public' | 'private' | 'password'],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get selectedType() {
    return this.form.controls.type.value;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
