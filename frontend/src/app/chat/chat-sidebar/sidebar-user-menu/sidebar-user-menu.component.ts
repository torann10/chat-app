import { Component, computed, inject, signal } from '@angular/core';
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { MenuModule } from "primeng/menu";
import { DividerModule } from 'primeng/divider';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';
import { ThemeService } from '../../../theme/theme.service';
import { AuthService } from '../../../auth/auth.service';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-sidebar-user-menu',
  imports: [
    AvatarModule, 
    ButtonModule, 
    MenuModule,
    DividerModule,
    I18NextPipe
  ],
  templateUrl: './sidebar-user-menu.component.html',
})
export class SidebarUserMenuComponent {
  private authService = inject(AuthService);
  private i18n = inject(I18NEXT_SERVICE);
  protected readonly theme = inject(ThemeService);

  protected readonly currentLang = signal(this.i18n.language ?? 'en');

  protected readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: this.i18n.t('language'),
      items: [
        {
          label: this.i18n.t('lang_en'),
          icon: this.currentLang() === 'en' ? 'pi pi-check' : undefined,
          command: () => this.changeLanguage('en'),
        },
        {
          label: this.i18n.t('lang_hu'),
          icon: this.currentLang() === 'hu' ? 'pi pi-check' : undefined,
          command: () => this.changeLanguage('hu'),
        },
      ],
    },
    {
      items: [
        {
          label: this.i18n.t(this.theme.isDark() ? 'light_mode' : 'dark_mode'),
          icon: this.theme.isDark() ? 'pi pi-sun' : 'pi pi-moon',
          command: () => this.theme.toggle(),
        },
        {
          label: this.i18n.t('log_out'),
          icon: 'pi pi-sign-out',
          styleClass: '[&_*]:!text-red-500',
          command: () => this.authService.logout(),
        },
      ],
    },
  ]);

  protected changeLanguage(lang: string): void {
    this.i18n.changeLanguage(lang).then(() => {
      this.currentLang.set(lang);
    });
  }
}
