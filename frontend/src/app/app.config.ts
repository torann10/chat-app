import { provideHttpClient, withInterceptors} from '@angular/common/http';
import { ApplicationConfig, inject, isDevMode, provideAppInitializer, provideBrowserGlobalErrorListeners,  } from '@angular/core';
import { provideTranslateService, TranslateService } from "@ngx-translate/core";
import { provideTranslateHttpLoader } from "@ngx-translate/http-loader";
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import { authInterceptor } from './auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/i18n/',
        suffix: '.json'
      })
    }),
    provideAppInitializer(() => {
      const  translate = inject(TranslateService);
      translate.use(translate.getBrowserLang() || "en");
    }),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: '.app-dark',
        },
      }
    }),
  ],
};