import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, provideAppInitializer, inject, PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { I18NEXT_SERVICE, I18NextLoadResult, provideI18Next, StrictErrorHandlingStrategy, withCustomErrorHandlingStrategy } from 'angular-i18next';
import { isPlatformBrowser } from '@angular/common';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import i18nextOptions from './i18next.options';

export function appInit() {
  return () => {
    const i18next = inject(I18NEXT_SERVICE);
    const platformId = inject(PLATFORM_ID);

    if (!isPlatformBrowser(platformId)) {
      return Promise.resolve();
    }
    const promise: Promise<I18NextLoadResult> = i18next
      .use(HttpApi)
      .use(LanguageDetector)
      .init(i18nextOptions);
    return promise;
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        },
      }
    }),
    provideAppInitializer(appInit()),
    provideI18Next(
      withCustomErrorHandlingStrategy(StrictErrorHandlingStrategy)
    )
  ],
};
