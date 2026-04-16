import { Component, inject, signal } from '@angular/core';
import { I18NextPipe } from 'angular-i18next';
import { SocialAuthComponent } from "../social-auth/social-auth.component";
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { I18NextValidationMessageDirective } from 'angular-i18next/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-login-form',
  imports: [
    I18NextPipe, 
    SocialAuthComponent, 
    PasswordModule, 
    ButtonModule, 
    ReactiveFormsModule,
    I18NextValidationMessageDirective,
    InputTextModule,
    RouterLink
  ],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly error = signal<string | null>(null);
  readonly isLoading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  getEmail() { return this.form.controls.email; }
  getPassword() { return this.form.controls.password; }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.isLoading.set(true);

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.error.set('error:invalid_credentials');
        this.isLoading.set(false);
      },
    });
  }
}
