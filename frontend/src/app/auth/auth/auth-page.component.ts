import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
 
@Component({
  selector: 'app-auth',
  imports: [
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DividerModule,
    MessageModule
  ],
  templateUrl: './auth-page.component.html',
})
export class AuthPageComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  authForm!: FormGroup;
  isLoginMode = true;
  error: string | null = null;
  isLoading = false;

  ngOnInit(): void {
    this.authForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: [''], 
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  switchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.error = null;
    this.authForm.reset();

    const usernameControl = this.authForm.get('username');
    if (this.isLoginMode) {
      usernameControl?.clearValidators();
    } else {
      usernameControl?.setValidators([Validators.required, Validators.minLength(3)]);
    }
    usernameControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (this.authForm.invalid) return;

    this.error = null;
    this.isLoading = true;
    const formValues = this.authForm.value;
    
    if (this.isLoginMode) {
      this.authService.login({ email: formValues.email, password: formValues.password }).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.error = 'Invalid email or password';
          this.isLoading = false;
        }
      });
    } else {
      this.authService.signup(formValues).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err) => {
          this.error = err.error?.error || 'Signup failed. Email or Username may be taken.';
          this.isLoading = false;
        }
      });
    }
  }
}
