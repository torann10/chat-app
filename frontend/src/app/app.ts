import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { I18NEXT_SERVICE } from 'angular-i18next';
import { tap } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private i18NextService = inject(I18NEXT_SERVICE);
  private router = inject(Router);

  ngOnInit(): void {
    this.i18NextService.events.languageChanged.subscribe(() => {
      const root = this.router.routerState.root;
      if (root != null && root.firstChild != null) {
        const data = root.firstChild.data;
        data
          .pipe(
            tap((data) => {
              this.updatePageTitle(data && data['value'] && data['value'].title);
            })
          )
          .subscribe();

      }
    });
  }

  updatePageTitle(title: string): void {
      const newTitle = title || 'application_title';
      console.log('Setting page title:', newTitle);
      //this.title.setTitle(newTitle);
      console.log('Setting page title end:', newTitle);
    }
}
