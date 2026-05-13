import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PrimeNG } from 'primeng/config';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  protected readonly title = signal('frontend');
  private primeng = inject(PrimeNG);
  private translate = inject(TranslateService);

  useLanguage(language: string): void {
    this.translate.use(language);
  }

  ngOnInit(): void {
    this.primeng.ripple.set(true);
  }

  updatePageTitle(title: string): void {
      const newTitle = title || 'title';
      this.title.set(newTitle);
    }
}
