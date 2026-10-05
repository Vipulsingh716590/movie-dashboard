import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { demoApiInterceptor } from './core/interceptors/demo-api.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // The hosted demo lives at an address we don't control, so it can't use real URL paths.
      ...(environment.demo ? [withHashLocation()] : [])
    ),
    provideHttpClient(withInterceptors([demoApiInterceptor, errorInterceptor]))
  ]
};
