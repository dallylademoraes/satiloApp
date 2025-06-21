// src/app/auth/login/login.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { lastValueFrom } from 'rxjs'; // Importe 'lastValueFrom' para usar async/await com Observables

// Importe seu AuthService
import { AuthService } from '../../services/auth.service'; // VERIFIQUE ESTE CAMINHO!

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
  ],
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // Injete seu AuthService aqui
  ) {
    console.log('LoginPage: Constructor executado!');
  }

  ngOnInit() {
    console.log('LoginPage: ngOnInit executado!');
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Função auxiliar para marcar todos os controles do formulário como 'touched' e 'dirty'
  // Isso ajuda a exibir as mensagens de validação imediatamente após uma tentativa de envio inválida
  markFormAsDirtyAndTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsDirty();
      control.markAsTouched();
      control.updateValueAndValidity(); // Garante que a validação seja reavaliada
    });
  }

  async login() { // O método login agora é 'async' para usar 'await'
    if (this.loginForm.valid) {
      console.log('Formulário de login válido:', this.loginForm.value);

      try {
        // Chame o método login do seu AuthService
        // 'lastValueFrom' converte o Observable em uma Promise, permitindo usar 'await'
        const response = await lastValueFrom(
          this.authService.login(this.loginForm.value) // Passa o objeto de credenciais
        );

        // Se a Promise for resolvida, significa sucesso no login
        console.log('Login bem-sucedido!', response);

        // *** AQUI É ONDE A NAVEGAÇÃO ACONTECE APÓS O SUCESSO ***
        // Redireciona para a rota 'pessoas/lista-pessoas' definida no seu app.routes.ts
        this.router.navigate(['/pessoas/lista-pessoas']);

      } catch (error) {
        // Se a Promise for rejeitada (erro do backend, credenciais inválidas, etc.)
        console.error('Erro no login:', error);
        // TODO: Aqui você pode adicionar lógica para mostrar uma mensagem de erro para o usuário
        // Exemplo: Usar um Ionic ToastController para exibir "Credenciais inválidas"
        // import { ToastController } from '@ionic/angular';
        // constructor(...) private toastController: ToastController (...)
        // const toast = await this.toastController.create({
        //   message: 'Erro no login: ' + (error instanceof Error ? error.message : 'Verifique suas credenciais.'),
        //   duration: 3000,
        //   color: 'danger'
        // });
        // toast.present();
      }

    } else {
      console.log('Formulário de login inválido.');
      // Marca todos os campos como tocados e sujos para exibir as mensagens de validação
      this.markFormAsDirtyAndTouched(this.loginForm);
    }
  }

  goToRegister() {
    console.log('Navegando para a página de registro...');
    this.router.navigate(['/register']);
  }
}