import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpTimeoutInterceptor } from '../shared/http-timeout.interceptor';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
} from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { AppTitleStrategy } from './app-title.strategy';
import { appRoutes } from './app.routes';
import { localeProviders } from './locale';
import { handleNavigationError } from './navigation-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    ...localeProviders,
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      appRoutes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withNavigationErrorHandler(handleNavigationError),
    ),
    { provide: TitleStrategy, useExisting: AppTitleStrategy },
    provideHttpClient(withInterceptors([httpTimeoutInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
