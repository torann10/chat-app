import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
 
@Component({
  selector: 'app-auth-page',
  imports: [
    RouterOutlet,
    TranslatePipe
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.scss',
})
export class AuthPageComponent {
  readonly year = new Date().getFullYear();
}
