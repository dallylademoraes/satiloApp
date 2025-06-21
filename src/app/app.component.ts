// src/app/app.component.ts

import { Component, OnInit } from '@angular/core'; // Adicione OnInit
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule
  ],
})
export class AppComponent implements OnInit { // Implemente OnInit
  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    console.log('AppComponent: Construtor iniciado.');
    this.authService.checkToken(); // Chama checkToken para inicializar o estado
    console.log('AppComponent: checkToken() chamado.');

    // Adicione esta inscrição para depurar o valor de isAuthenticated$
    this.authService.isAuthenticated$().subscribe(val => {
      console.log('AppComponent: isAuthenticated$ emitted:', val);
    });
  }

  ngOnInit() {
    console.log('AppComponent: ngOnInit executado.');
  }

  async logout() {
    await this.authService.logout();
    console.log('AppComponent: Logout realizado.');
  }

  goToTreeView() {
    if (this.authService.currentUserId) {
      this.router.navigateByUrl(`/pessoas/arvore/${this.authService.currentUserId}`);
      console.log(`AppComponent: Navegando para a árvore do usuário ID: ${this.authService.currentUserId}`);
    } else {
      this.router.navigateByUrl('/pessoas/lista-pessoas');
      console.warn('AppComponent: ID do usuário atual não encontrado para "Ver Árvore". Redirecionando para a lista de pessoas.');
    }
  }
}