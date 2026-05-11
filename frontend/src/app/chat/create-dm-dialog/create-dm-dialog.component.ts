import { Component, input, model, output, viewChild, ViewEncapsulation } from '@angular/core';
import { I18NextPipe } from 'angular-i18next';
import { DialogModule} from 'primeng/dialog';
import { UserPickerComponent } from '../user-picker/user-picker.component';
import { User } from 'shared';

@Component({
  selector: 'app-create-dm-dialog',
  imports: [
    DialogModule,
    I18NextPipe,
    UserPickerComponent
  ],
  templateUrl: './create-dm-dialog.component.html',
  styleUrl: './create-dm-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CreateDmDialogComponent {
  visible = model(false);

  excludeIds = input<number[]>([]);

  submitted = output<User>();

  private readonly picker = viewChild.required(UserPickerComponent);

  onUserSelected(user: User): void {
    this.submitted.emit(user);
    this.close();
  }

  close(): void {
    this.visible.set(false);
    this.picker().reset();
  }
}
