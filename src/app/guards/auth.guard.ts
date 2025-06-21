// src/app/guards/auth.guard.ts

import { Injectable } from '@angular/core';
import {
  CanActivate, Router, UrlTree,
  ActivatedRouteSnapshot, RouterStateSnapshot // Adicione estes imports
} from '@angular/router';
import { Observable } from 'rxjs';
import { take, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AlertController } from '@ionic/angular'; // Importe AlertController

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate { // Implementa CanActivate

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController // Injete AlertController
  ) {}

  canActivate( // Método canActivate
    route: ActivatedRouteSnapshot, // Snapshot da rota que está sendo ativada
    state: RouterStateSnapshot // Snapshot do estado do roteador
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.authService.isAuthenticated$().pipe(
      take(1), // Pega o estado atual de autenticação e completa
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log('AuthGuard (CanActivate): Usuário autenticado. Acesso permitido.');
          return true; // Permite o acesso à rota
        } else {
          // Exibe o alerta e redireciona para a página de login
          console.log('AuthGuard (CanActivate): Usuário não autenticado. Acesso negado, redirecionando para login.');
          this.showAlert('Você precisa estar logado para acessar esta página.'); // Passa a mensagem para o alerta
          return this.router.createUrlTree(['/login']); // Redireciona para /login
        }
      })
    );
  }

  /**
   * Exibe um alerta Ionic.
   * @param message A mensagem a ser exibida no alerta.
   */
  async showAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'Acesso Negado',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}