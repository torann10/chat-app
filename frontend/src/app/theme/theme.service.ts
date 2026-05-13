import { isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'app-dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isDark = signal(this.loadPreference());

  constructor() {
    this.applyClass(this.isDark());

    effect(() => {
      const dark = this.isDark();
      this.applyClass(dark);
      if (this.isBrowser) {
        localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
      }
    });
  }

  toggle(): void {
    this.isDark.update((v) => !v);
  }

  private applyClass(dark: boolean): void {
    if (!this.isBrowser) return;
    document.documentElement.classList.toggle(DARK_CLASS, dark);
  }

  private loadPreference(): boolean {
    if (!this.isBrowser) return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === 'dark' : true;
  }
}
