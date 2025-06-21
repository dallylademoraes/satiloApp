// src/app/home/home.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    RouterModule
  ]
})
export class HomePage implements OnInit {

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.authService.checkToken();
  }

  async logout() {
    await this.authService.logout();
  }

  goToMyLineage() {
    this.router.navigateByUrl('/pessoas/lista-pessoas');
  }

  goToAddPerson() {
    this.router.navigateByUrl('/pessoas/criar-pessoa');
  }

  goToTreeView() {
    if (this.authService.currentUserId) {
      this.router.navigateByUrl(`/pessoas/arvore/${this.authService.currentUserId}`);
    } else {
      this.router.navigateByUrl('/pessoas/lista-pessoas');
    }
  }

  startMyLineage() {
    this.router.navigateByUrl('/pessoas/lista-pessoas');
  }
}