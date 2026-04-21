import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { I18NEXT_SERVICE } from 'angular-i18next';
import { PrimeNG } from 'primeng/config';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  protected readonly title = signal('frontend');
  private i18NextService = inject(I18NEXT_SERVICE);
  private router = inject(Router);
  private primeng = inject(PrimeNG);

  ngOnInit(): void {
    this.primeng.ripple.set(true);
  }

  updatePageTitle(title: string): void {
      const newTitle = title || 'title';
      this.title.set(newTitle);
    }
}
