import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SocialAuthComponent } from "../social-auth/social-auth.component";
import { I18NextPipe } from 'angular-i18next';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { I18NextValidationMessageDirective } from 'angular-i18next/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-signup-form',
  imports: [
    ReactiveFormsModule, 
    ButtonModule, 
    SocialAuthComponent, 
    I18NextPipe, 
    PasswordModule, 
    I18NextValidationMessageDirective,
    InputTextModule,
    RouterLink
  ],
  templateUrl: './signup-form.component.html',
})
export class SignupFormComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly isLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    fullname: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(32)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  getEmail() { return this.form.controls.email; }
  getFullname() { return this.form.controls.fullname; }
  getPassword() { return this.form.controls.password; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.isLoading.set(true);

    this.authService.signup(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(err.error?.error ?? 'error:sign_up_failed');
        this.isLoading.set(false);
      },
    });
  }
}
  