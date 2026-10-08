import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt-PT';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID, Provider } from '@angular/core';

registerLocaleData(localePt);

/**
 * The app is Portuguese only: Angular's date, number and currency pipes format for pt-PT.
 * Also provided to tests (angular.json: test.options.providersFile).
 */
export const localeProviders: Provider[] = [
  { provide: LOCALE_ID, useValue: 'pt-PT' },
  { provide: DEFAULT_CURRENCY_CODE, useValue: 'EUR' },
];
