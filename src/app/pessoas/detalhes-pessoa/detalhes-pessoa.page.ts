// src/app/pessoas/detalhes-pessoa/detalhes-pessoa.page.ts

import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { IonicModule, LoadingController, AlertController, ToastController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { PessoasService, Pessoa } from 'src/app/services/pessoas.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs'; // Já está aqui, ótimo!

// **** IMPORTAR O PIPE AQUI ****
import { FilterByGenderPipe } from '../../pipes/filter-by-gender.pipe'; // Ajuste o caminho se necessário!

@Component({
  selector: 'app-detalhes-pessoa',
  templateUrl: './detalhes-pessoa.page.html',
  styleUrls: ['./detalhes-pessoa.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // **** ADICIONAR O PIPE AQUI NO ARRAY DE IMPORTS ****
    FilterByGenderPipe // Adicione esta linha
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetalhesPessoaPage implements OnInit {
  personForm!: FormGroup;
  isEditMode = false;
  personId: number | null = null;
  selectedPhoto: File | null = null;

  todasPessoas: Pessoa[] = [];

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private pessoasService: PessoasService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadAllPeopleForSelectors();

    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.personId = +id;
        this.isEditMode = true;
        this.loadPersonData(this.personId);
      } else {
        this.isEditMode = false;
        this.personId = null;
        this.personForm.reset({
          genero: '',
          status_vida: 'Vivo(a)',
          pai: null,
          mae: null
        });
      }
    });
  }

  initForm() {
    this.personForm = this.fb.group({
      nome: ['', Validators.required],
      data_nascimento: [''],
      data_falecimento: [''],
      genero: ['', Validators.required],
      pai: [null],
      mae: [null],
      historia_pessoal: [''], // Já está correto aqui
      status_vida: ['Vivo(a)', Validators.required],
    });
  }

  async loadPersonData(id: number) {
    const loading = await this.loadingController.create({ message: 'Carregando pessoa...' });
    await loading.present();

    this.pessoasService.getPessoa(id).subscribe({
      next: (pessoa: Pessoa) => {
        loading.dismiss();
        this.personForm.patchValue({
          nome: pessoa.nome,
          data_nascimento: pessoa.data_nascimento,
          data_falecimento: pessoa.data_falecimento,
          genero: pessoa.genero,
          pai: pessoa.pai || null,
          mae: pessoa.mae || null,
          historia_pessoal: pessoa.historia_pessoal, // Já está correto aqui
          status_vida: pessoa.status_vida
        });
      },
      error: async (err: HttpErrorResponse) => {
        loading.dismiss();
        console.error('Erro ao carregar pessoa:', err);
        const alert = await this.alertController.create({
          header: 'Erro',
          message: 'Não foi possível carregar os dados da pessoa.',
          buttons: ['OK']
        });
        await alert.present();
        this.router.navigateByUrl('/pessoas/lista-pessoas');
      }
    });
  }

  loadAllPeopleForSelectors() {
    this.pessoasService.getTodasPessoas().subscribe({
      next: (data: Pessoa[]) => {
        this.todasPessoas = data.filter(p => p.id !== this.personId);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erro ao carregar pessoas para seletores:', err);
        this.presentToast('Erro ao carregar opções de pais/mães.', 'danger');
      }
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedPhoto = file;
    }
  }

  async onSubmit() {
    if (this.personForm.invalid) {
      this.markFormAsDirtyAndTouched(this.personForm);
      this.presentToast('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Atualizando pessoa...' : 'Criando pessoa...'
    });
    await loading.present();

    const formData: Pessoa = this.personForm.value;
    if (this.selectedPhoto) {
      formData.foto = this.selectedPhoto;
    }

    let requestObservable: Observable<Pessoa>;
    if (this.isEditMode && this.personId) {
      requestObservable = this.pessoasService.atualizarPessoa(this.personId, formData);
    } else {
      requestObservable = this.pessoasService.criarPessoa(formData);
    }

    requestObservable.subscribe({
      next: async (res: Pessoa) => {
        loading.dismiss();
        this.presentToast(`Pessoa ${this.isEditMode ? 'atualizada' : 'criada'} com sucesso!`, 'success');
        this.router.navigateByUrl('/pessoas/lista-pessoas');
      },
      error: async (err: HttpErrorResponse) => {
        loading.dismiss();
        console.error('Erro ao salvar pessoa:', err);
        let errorMessage = 'Não foi possível salvar a pessoa. Verifique os dados.';
        if (err.error && typeof err.error === 'object') {
          try {
            const errorBody = typeof err.error === 'string' ? JSON.parse(err.error) : err.error;
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
          } catch (e) {
            errorMessage = `Erro ao processar detalhes: ${err.message || String(err.error || err)}`;
          }
        }
        this.presentToast(`Erro: ${errorMessage}`, 'danger');
      }
    });
  }

  markFormAsDirtyAndTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsDirty();
      control.markAsTouched();
      control.updateValueAndValidity();
    });
  }

  async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }

  goBack() {
    this.router.navigateByUrl('/pessoas/lista-pessoas');
  }
}