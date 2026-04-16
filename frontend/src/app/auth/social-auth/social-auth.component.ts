import { Component } from '@angular/core';
import { I18NextPipe } from 'angular-i18next';

@Component({
  selector: 'app-social-auth',
  imports: [I18NextPipe],
  templateUrl: './social-auth.component.html',
})
export class SocialAuthComponent {}
