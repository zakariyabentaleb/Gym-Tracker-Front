import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { AppModule } from './app.module';
import { AppRoutingModule } from './app-routing.module';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    importProvidersFrom(AppModule),
    importProvidersFrom(AppRoutingModule)
  ]
};
