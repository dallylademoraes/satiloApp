// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.page').then((m) => m.RegisterPage),
  },
  // REMOVIDO: Rota 'em-memoria-do-meu'
  /*
  {
    path: 'em-memoria-do-meu',
    loadComponent: () => import('./memoria/memoria.page').then((m) => m.MemoriaPage),
    // canActivate: [AuthGuard]
  },
  */
  {
    path: 'pessoas', // Rota pai para as funcionalidades protegidas
    canActivate: [AuthGuard],
    children: [
      {
        path: 'lista-pessoas',
        loadComponent: () => import('./pessoas/lista-pessoas/lista-pessoas.page').then((m) => m.ListaPessoasPage),
      },
      {
        path: 'detalhes-pessoa/:id',
        loadComponent: () => import('./pessoas/detalhes-pessoa/detalhes-pessoa.page').then((m) => m.DetalhesPessoaPage),
      },
      {
        path: 'criar-pessoa',
        loadComponent: () => import('./pessoas/detalhes-pessoa/detalhes-pessoa.page').then((m) => m.DetalhesPessoaPage),
      },
      {
        path: 'arvore/:id',
        loadComponent: () => import('./pessoas/arvore/arvore.page').then((m) => m.ArvorePage),
      },
      {
        path: 'arvore/minha',
        loadComponent: () => import('./pessoas/arvore/arvore.page').then((m) => m.ArvorePage),
      },
      {
        path: '',
        redirectTo: 'lista-pessoas',
        pathMatch: 'full',
      },
    ],
  },
  { path: '**', redirectTo: 'home' }
];