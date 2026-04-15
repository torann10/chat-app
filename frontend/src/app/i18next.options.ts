import { defaultInterpolationFormat, interpolationFormat } from "angular-i18next";
import type * as i18n from 'i18next';
import type { HttpBackendOptions } from "i18next-http-backend";

export const i18nextOptions: i18n.InitOptions & { backend: HttpBackendOptions} = {
  supportedLngs:['en', 'hu'],
  fallbackLng: 'en',
  debug: true,
  returnEmptyString: false,
  ns: [
    'translation',
    'validation',
    'error'
  ],
  backend: {
    loadPath: 'locales/{{lng}}.{{ns}}.json',
  },
  detection: {
    order: ['cookie', 'header'],
    lookupCookie: 'lang',
    caches: ['cookie'],
    cookieMinutes: 10080,
  }
};

export default i18nextOptions;