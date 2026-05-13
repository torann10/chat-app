import { Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { MenuModule } from "primeng/menu";
import { DividerModule } from 'primeng/divider';
import { ThemeService } from '../../../theme/theme.service';
import { AuthService } from '../../../auth/auth.service';
import { MenuItem } from 'primeng/api';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sidebar-user-menu',
  imports: [
    AvatarModule, 
    ButtonModule, 
    MenuModule,
    DividerModule,
    TranslatePipe
  ],
  templateUrl: './sidebar-user-menu.component.html',
  styleUrl: './sidebar-user-menu.component.scss',
})
export class SidebarUserMenuComponent {
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  protected readonly theme = inject(ThemeService);

  protected readonly currentUserName = this.authService.currentUser()?.email;

  protected readonly currentLang = signal(this.translate.getCurrentLang() ?? 'en');

  protected readonly langChangeSignal = toSignal(this.translate.onLangChange);

  protected readonly menuItems = computed<MenuItem[]>(() => {
    this.langChangeSignal();

    return [
      {
        label: this.translate.instant('app.language'),
        items: [
          {
            label: this.translate.instant('app.lang_en'),
            icon: this.currentLang() === 'en' ? 'pi pi-check' : undefined,
            command: (() => this.changeLanguage('en')),
          },
          {
            label: this.translate.instant('app.lang_hu'),
            icon: this.currentLang() === 'hu' ? 'pi pi-check' : undefined,
            command: () => this.changeLanguage('hu'),
          },
        ],
      },
      {
        items: [
          {
            label: this.translate.instant(this.theme.isDark() ? 'app.light_mode' : 'app.dark_mode'),
            icon: this.theme.isDark() ? 'pi pi-sun' : 'pi pi-moon',
            command: () => this.theme.toggle(),
          },
          {
            label: this.translate.instant('app.log_out'),
            icon: 'pi pi-sign-out',
            styleClass: 'log-out',
            command: () => this.authService.logout(),
          },
        ],
      },
    ]
  });

  protected changeLanguage(lang: string): void {
    this.translate.use(lang).subscribe(() => {
      this.currentLang.set(lang);
    });
  }
}
