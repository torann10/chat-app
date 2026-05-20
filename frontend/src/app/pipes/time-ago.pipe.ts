import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({
  name: 'timeAgo',
  pure: false,
})
export class TimeAgoPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(value: string | Date |number): string {
    if (!value) return '';

    const currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';

    const date = new Date(value);
    const now = new Date();
    const elapsed = date.getTime() - now.getTime();

    const rtf = new Intl.RelativeTimeFormat(currentLang, { numeric: 'auto' });

    const isCurrentYear = date.getFullYear() === now.getFullYear();

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    };

    if (!isCurrentYear) {
      dateOptions.year = 'numeric';
    }

    const dtf = new Intl.DateTimeFormat(currentLang, dateOptions);

    const seconds = Math.round(elapsed / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (Math.abs(seconds) < 60) return rtf.format(seconds, 'second');
    if (Math.abs(minutes) < 60) return rtf.format(minutes, 'minute');
    if (Math.abs(hours) < 24) return rtf.format(hours, 'hour');
    if (Math.abs(days) < 2) return rtf.format(days, 'day');

    return dtf.format(date);
  }
}
