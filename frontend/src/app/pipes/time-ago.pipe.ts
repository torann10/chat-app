import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
})
export class TimeAgoPipe implements PipeTransform {
  private locale = inject(LOCALE_ID);

  transform(value: string | Date |number): string {
    if (!value) return '';

    const date = new Date(value);
    const now = new Date();
    const elapsed = date.getTime() - now.getTime();

    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });

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

    const dtf = new Intl.DateTimeFormat(this.locale, dateOptions);

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
