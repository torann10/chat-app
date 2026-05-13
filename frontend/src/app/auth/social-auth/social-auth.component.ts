import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-social-auth',
  imports: [TranslatePipe],
  templateUrl: './social-auth.component.html',
  styleUrl: './social-auth.component.scss',
})
export class SocialAuthComponent {}
