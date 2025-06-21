// src/app/interceptors/auth.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  // Corrigido: Tipagem da promise para Promise<Storage | void>
  private _storageInitialized: Promise<Storage | void>; 

  constructor(private storage: Storage) {
    // A criação do storage retorna uma Promise<Storage>, então a tipagem acima está correta.
    this._storageInitialized = this.storage.create();
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Primeiro, esperamos que o storage seja inicializado
    return from(this._storageInitialized).pipe(
      // Depois que ele for inicializado (não importa o que ele retorna, mas que termine),
      // obtemos o token do storage.
      switchMap(() => from(this.storage.get('authToken'))),
      switchMap(authToken => {
        if (authToken) {
          request = request.clone({
            setHeaders: {
              Authorization: `Token ${authToken}`
            }
          });
        }
        return next.handle(request);
      })
    );
  }
}