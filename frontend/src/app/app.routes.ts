import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth/auth.component';
import { authGuard } from './auth/auth.guard';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { 
    path: 'dashboard',
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '/login' }
];
