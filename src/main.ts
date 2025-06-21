// src/main.ts

import { enableProdMode, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding } from '@angular/router';

import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IonicStorageModule } from '@ionic/storage-angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// --- IMPORTAÇÕES PARA ÍCONES ---
import { addIcons } from 'ionicons';
import {
  logOutOutline,
  gitBranchOutline,
  createOutline,
  trashOutline,
  addOutline
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { AuthInterceptor } from './app/interceptors/auth.interceptor';

if (environment.production) {
  enableProdMode();
}

// --- REGISTRO DOS ÍCONOS ---
console.log('Main.ts: Iniciando registro dos Ionicons.'); // Debug: Início do registro
addIcons({
  logOutOutline,
  gitBranchOutline,
  createOutline,
  trashOutline,
  addOutline
});
console.log('Main.ts: Ionicons registrados com sucesso.'); // Debug: Confirmação do registro

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(), // Chamada da função para configurar o Ionic

    importProvidersFrom(HttpClientModule, IonicStorageModule.forRoot(), FormsModule, ReactiveFormsModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
}).catch(err => console.error('Main.ts: Erro ao inicializar a aplicação:', err)); // Debug: Erro de inicialização