import { Routes } from '@angular/router';
import { AuthPageComponent } from './auth/auth-page/auth-page.component';
import { authGuard } from './auth/auth.guard';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
import { ChatContainerComponent } from './chat-container/chat-container.component';
import { noAuthGuard } from './auth/no-auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'auth', 
    component: AuthPageComponent,
    canActivate: [noAuthGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { 
        path: 'login',
        loadComponent: () => 
          import('./auth/login-form/login-form.component').then((m) => m.LoginFormComponent),
      },
      { 
        path: 'signup',
        loadComponent: () => 
          import('./auth/signup-form/signup-form.component').then((m) => m.SignupFormComponent),
      },
    ], 
  },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { 
    path: 'dashboard',
    component: ChatContainerComponent,
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '/dashboard' }
];
