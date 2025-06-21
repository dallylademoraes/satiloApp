// src/app/pessoas/lista-pessoas/lista-pessoas.page.ts

import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular'; // Adicionado ToastController
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from 'src/app/services/auth.service';
import { PessoasService, Pessoa } from 'src/app/services/pessoas.service';

@Component({
  selector: 'app-lista-pessoas',
  templateUrl: './lista-pessoas.page.html',
  styleUrls: ['./lista-pessoas.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ListaPessoasPage implements OnInit {
  pessoas: Pessoa[] = [];
  isLoading = false;

  constructor(
    public authService: AuthService, // Tornar público para acesso no HTML ([disabled])
    private pessoasService: PessoasService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController // Injetar ToastController
  ) { }

  ngOnInit() {
    this.loadPessoas();
  }

  ionViewWillEnter() {
    // Certificar-se de que o estado de autenticação está atualizado ao entrar na view
    this.authService.checkToken(); 
    this.loadPessoas();
  }

  async loadPessoas(event?: any) {
    this.isLoading = true;
    const loading = await this.loadingController.create({
      message: 'Carregando pessoas...',
      spinner: 'crescent'
    });
    if (!event) {
      await loading.present();
    }

    this.pessoasService.getTodasPessoas().subscribe({
      next: (data: Pessoa[]) => {
        this.pessoas = data;
        loading.dismiss();
        this.isLoading = false;
        console.log('Pessoas carregadas:', this.pessoas);
        if (event) {
          event.target.complete();
        }
      },
      error: async (err: HttpErrorResponse | any) => {
        loading.dismiss();
        this.isLoading = false;
        console.error('Erro ao carregar pessoas:', err);
        let errorMessage = 'Não foi possível carregar a lista de pessoas. Verifique sua conexão ou se está logado.';

        if (err instanceof HttpErrorResponse) {
            try {
                const errorBody = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
                if (errorBody && typeof errorBody === 'object' && Object.keys(errorBody).length > 0) {
                    const messages: string[] = [];
                    for (const key in errorBody) {
                        if (errorBody.hasOwnProperty(key)) {
                            const errorValue = errorBody[key];
                            if (Array.isArray(errorValue)) {
                                messages.push(`${key}: ${errorValue.map(e => String(e)).join(', ')}`);
                            } else if (typeof errorValue === 'string') {
                                messages.push(`${key}: ${errorValue}`);
                            } else if (errorValue && typeof errorValue === 'object') {
                                messages.push(`${key}: ${JSON.stringify(errorValue)}`);
                            }
                        }
                    }
                    if (messages.length > 0) {
                        errorMessage = messages.join('; ');
                    } else if (errorBody.detail) {
                        errorMessage = errorBody.detail;
                    } else if (errorBody.non_field_errors) {
                        errorMessage = errorBody.non_field_errors.join('; ');
                    } else {
                        errorMessage = 'Resposta de erro inesperada do servidor.';
                    }
                } else {
                    errorMessage = 'Formato de erro do servidor inesperado.';
                }
            } catch (e) {
                errorMessage = `Erro ao processar detalhes: ${err.message || String(err.error || err)}`;
            }
        } else if (err && typeof err.message === 'string') {
            errorMessage = err.message;
        } else {
            errorMessage = 'Erro desconhecido. Por favor, tente novamente.';
        }

        const alert = await this.alertController.create({
          header: 'Erro',
          message: errorMessage,
          buttons: ['OK']
        });
        await alert.present();
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sair',
      message: 'Tem certeza que deseja sair?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sair',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });
    await alert.present();
  }

  goToCreatePerson() {
    this.router.navigateByUrl('/pessoas/criar-pessoa');
  }

  viewPersonDetails(id: number | undefined) {
    if (id) {
      this.router.navigateByUrl(`/pessoas/detalhes-pessoa/${id}`);
    }
  }

  // viewArvore(id: number | undefined) { // REMOVIDO: Este método não é mais usado individualmente
  //   if (id) {
  //     this.router.navigateByUrl(`/pessoas/arvore/${id}`);
  //   }
  // }

  // **** NOVO MÉTODO: Para o botão "Ver Minha Árvore" no topo ****
  viewMyTree() {
    if (this.authService.currentUserId) {
      this.router.navigateByUrl(`/pessoas/arvore/${this.authService.currentUserId}`);
    } else {
      console.warn('Não foi possível carregar a árvore: ID do usuário logado não encontrado.');
      this.presentToast('Não foi possível carregar a árvore: Faça login novamente.', 'danger');
      this.router.navigateByUrl('/login', { replaceUrl: true }); // Redireciona para login se não tiver ID
    }
  }

  // **** NOVO MÉTODO: Definir a pessoa selecionada como o usuário atual ****
  async setAsCurrentUser(personId: number | undefined, personName: string | undefined) {
    if (!personId || !personName) return;

    const confirmAlert = await this.alertController.create({
      header: 'Definir como Eu',
      message: `Deseja definir '${personName}' como a pessoa que você representa na árvore genealógica?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            // Lógica para atualizar o 'currentUserId' no AuthService e no Storage
            // Você precisará de um método no AuthService para isso
            await this.authService.setCurrentUserPerson(personId, personName);
            
            this.presentToast(`'${personName}' definido(a) como você.`, 'success');
            this.loadPessoas(); // Recarrega a lista para atualizar o estado do botão
          }
        }
      ]
    });
    await confirmAlert.present();
  }

  // Helper para exibir toasts (mensagens pequenas no topo/fundo da tela)
  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom', // 'top', 'middle', 'bottom'
      color: color
    });
    toast.present();
  }


  async deletePerson(id: number | undefined, nome: string | undefined) {
    if (!id || !nome) return;

    const alert = await this.alertController.create({
      header: 'Excluir Pessoa',
      message: `Tem certeza que deseja excluir '${nome}'?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Excluindo...',
              spinner: 'crescent'
            });
            await loading.present();

            this.pessoasService.excluirPessoa(id).subscribe({
              next: async () => {
                loading.dismiss();
                const confirmationAlert = await this.alertController.create({
                  message: `'${nome}' excluído(a) com sucesso.`,
                  buttons: ['OK']
                });
                confirmationAlert.present();
                this.loadPessoas(); // Recarrega a lista após exclusão
              },
              error: async (err: HttpErrorResponse | any) => {
                loading.dismiss();
                let errorMessage = 'Não foi possível excluir a pessoa. Tente novamente.';

                if (err instanceof HttpErrorResponse) {
                    try {
                        const errorBody = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
                        if (errorBody && typeof errorBody === 'object' && Object.keys(errorBody).length > 0) {
                            const messages: string[] = [];
                            for (const key in errorBody) {
                                if (errorBody.hasOwnProperty(key)) {
                                    const errorValue = errorBody[key];
                                    if (Array.isArray(errorValue)) {
                                        messages.push(`${key}: ${errorValue.map(e => String(e)).join(', ')}`);
                                    } else if (typeof errorValue === 'string') {
                                        messages.push(`${key}: ${errorValue}`);
                                    } else if (errorValue && typeof errorValue === 'object') {
                                        messages.push(`${key}: ${JSON.stringify(errorValue)}`);
                                    }
                                }
                            }
                            if (messages.length > 0) {
                                errorMessage = messages.join('; ');
                            } else if (errorBody.detail) {
                                errorMessage = errorBody.detail;
                            } else if (errorBody.non_field_errors) {
                                errorMessage = errorBody.non_field_errors.join('; ');
                            } else {
                                errorMessage = 'Resposta de erro inesperada do servidor.';
                            }
                        } else {
                            errorMessage = 'Formato de erro do servidor inesperado.';
                        }
                    } catch (e) {
                        errorMessage = `Erro ao processar detalhes: ${err.message || String(err.error || err)}`;
                    }
                } else if (err && typeof err.message === 'string') {
                    errorMessage = err.message;
                } else {
                    errorMessage = 'Erro desconhecido. Por favor, tente novamente.';
                }

                const errorAlert = await this.alertController.create({
                  header: 'Erro ao Excluir',
                  message: errorMessage,
                  buttons: ['OK']
                });
                await errorAlert.present();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }
}