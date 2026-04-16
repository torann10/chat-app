import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18NextPipe } from 'angular-i18next';
 
@Component({
  selector: 'app-auth-page',
  imports: [
    RouterOutlet,
    I18NextPipe
  ],
  templateUrl: './auth-page.component.html',
})
export class AuthPageComponent {
  readonly year = new Date().getFullYear();
}
