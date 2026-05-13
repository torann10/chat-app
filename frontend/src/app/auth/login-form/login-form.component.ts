import { Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { SocialAuthComponent } from "../social-auth/social-auth.component";
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login-form',
  imports: [
    TranslatePipe, 
    SocialAuthComponent, 
    PasswordModule, 
    ButtonModule, 
    ReactiveFormsModule,
    InputTextModule,
    RouterLink
  ],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  encapsulation: ViewEncapsulation.None,
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
        this.error.set('error.invalid_credentials');
        this.isLoading.set(false);
      },
    });
  }
}
