import { Component, computed, inject, input, output, signal, ViewEncapsulation } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AvatarModule } from 'primeng/avatar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SkeletonModule } from 'primeng/skeleton';
import { catchError, debounceTime, distinctUntilChanged, of, startWith, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop'
import { ApiService } from '../../api/api.service';
import { User } from 'shared';
import { I18NextCapPipe, I18NextPipe } from 'angular-i18next';
import { InputTextModule } from 'primeng/inputtext';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f59e0b', '#3b82f6',
];

@Component({
  selector: 'app-user-picker',
  imports: [
    AvatarModule,
    IconFieldModule,
    InputIconModule,
    SkeletonModule,
    I18NextPipe,
    ReactiveFormsModule,
    I18NextCapPipe,
    InputTextModule
  ],
  templateUrl: './user-picker.component.html',
  styleUrl: './user-picker.component.scss',
})
export class UserPickerComponent {
  private apiService = inject(ApiService);

  excludeIds = input<number[]>([]);

  userSelected = output<User>();

  readonly isLoading = signal(true);
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly skeletonRows = Array.from({ length: 5 });

  private readonly rawResult = toSignal(
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      distinctUntilChanged(),
      tap(() => this.isLoading.set(true)),
      switchMap((term) =>
        this.apiService
          .getUsers({ search: term || undefined, limit: 50 })
          .pipe(catchError(() => of({ users: [], total: 0, page: 1, totalPages: 1 })))
      ),
      tap(() => this.isLoading.set(false))
    ),
    { initialValue: null }
  );

  readonly users = computed(() => {
    const result = this.rawResult();
    if (!result) return [];
    const excluded = new Set(this.excludeIds());
    return result.users.filter((u) => !excluded.has(u.id));
  });

  select(user: User): void {
    this.userSelected.emit(user);
  }

  reset(): void {
    this.searchControl.setValue('');
  }

  initials(user: User): string {
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
