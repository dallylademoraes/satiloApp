// src/app/auth/register/register.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http'; // Importe HttpErrorResponse para tipagem

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', [Validators.required]] // Confirmar senha
    });
  }

  ngOnInit() {}

  async register() {
    if (this.registerForm.invalid) {
      const alert = await this.alertController.create({
        header: 'Erro de Validação',
        message: 'Por favor, preencha todos os campos corretamente.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const { username, password, password2 } = this.registerForm.value;

    if (password !== password2) {
      const alert = await this.alertController.create({
        header: 'Erro',
        message: 'As senhas não conferem.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registrando...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.register({ username, password, password2 }).subscribe({
      next: (res) => {
        loading.dismiss();
        this.router.navigateByUrl('/pessoas/lista-pessoas', { replaceUrl: true });
      },
      error: async (err: any) => { // Tipagem 'any' para o erro
        loading.dismiss();
        console.error('Erro no registro:', err);
        let errorMessage = 'Não foi possível registrar. Tente novamente.';

        // Lógica de tratamento de erro mais robusta
        if (err instanceof HttpErrorResponse && err.error) {
            try {
                // Tenta parsear o corpo do erro, que pode ser uma string JSON ou um objeto
                const errorBody = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
                
                if (errorBody && typeof errorBody === 'object') {
                    const messages: string[] = [];
                    // Itera sobre as propriedades do objeto de erro (username, password, etc.)
                    for (const key in errorBody) {
                        if (errorBody.hasOwnProperty(key)) { // Verifica se a propriedade pertence ao objeto
                            const errorValue = errorBody[key];
                            if (Array.isArray(errorValue)) {
                                // Se for um array (ex: ["Este campo é obrigatório."]), junta as mensagens
                                messages.push(`${key}: ${errorValue.join(', ')}`);
                            } else if (typeof errorValue === 'string') {
                                // Se for uma string simples
                                messages.push(`${key}: ${errorValue}`);
                            } else if (errorValue && typeof errorValue === 'object') {
                                // Se for um objeto aninhado, tenta serializar
                                messages.push(`${key}: ${JSON.stringify(errorValue)}`);
                            }
                        }
                    }

                    if (messages.length > 0) {
                        errorMessage = messages.join('; ');
                    } else if (errorBody.detail) { // Para erros genéricos como "Credenciais inválidas."
                        errorMessage = errorBody.detail;
                    } else if (errorBody.non_field_errors) { // Para erros globais do Django form
                        errorMessage = errorBody.non_field_errors.join('; ');
                    } else {
                        errorMessage = 'Resposta de erro inesperada do servidor.';
                    }
                } else {
                    errorMessage = 'Formato de erro do servidor inesperado.';
                }
            } catch (e) {
                // Se o corpo do erro não for um JSON válido ou ocorrer outro erro no parse
                errorMessage = `Erro ao processar resposta do servidor: ${err.message || JSON.stringify(err.error || err)}`;
            }
        } else if (err.message) {
            errorMessage = err.message;
        } else {
            errorMessage = 'Erro desconhecido. Por favor, tente novamente.';
        }

        const alert = await this.alertController.create({
          header: 'Erro de Registro',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/login');
  }
}