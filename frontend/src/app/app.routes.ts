import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth/auth.component';
import { authGuard } from './auth/auth.guard';
import { AuthCallbackComponent } from './auth/auth-callback/auth-callback.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatContainerComponent } from './chat-container/chat-container.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { path: 'auth-callback', component: AuthCallbackComponent },
  { 
    path: 'chat-container',
    component: ChatContainerComponent,
    canActivate: [authGuard] 
  },
  { path: '**', redirectTo: '/auth' }
];
