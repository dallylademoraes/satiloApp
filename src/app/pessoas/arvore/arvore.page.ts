// src/app/pessoas/arvore/arvore.page.ts

import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importe ModalController aqui, além dos outros controllers
import { IonicModule, LoadingController, AlertController, ToastController, ModalController } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import {
  PessoasService,
  Pessoa,
  ArvoreResponse,
  FamilyUnit,
  TreeLevel,
  RegiaoFamiliar
} from 'src/app/services/pessoas.service';
import { AuthService } from 'src/app/services/auth.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Importe o componente do modal de detalhes da pessoa
import { PersonDetailsModalComponent } from '../person-details-modal/person-details-modal.component';


// Interfaces auxiliares para o front-end (adaptadas do Django)
interface GroupedNode {
  group_key: string;
  group_type: 'couple-group' | 'sibling-group' | 'solo-group';
  nodes: Pessoa[];
}

interface DisplayTreeLevel {
  level: number;
  grouped_nodes: GroupedNode[];
}

@Component({
  selector: 'app-arvore',
  templateUrl: './arvore.page.html',
  styleUrls: ['./arvore.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
    // Não precisa importar PersonDetailsModalComponent aqui diretamente,
    // pois ele é carregado dinamicamente pelo ModalController
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArvorePage implements OnInit {
  rootPerson: Pessoa | null = null;
  allPersonsMap: { [key: number]: Pessoa } = {};
  allFamiliesMap: { [key: string]: FamilyUnit } = {};
  treeLevels: DisplayTreeLevel[] = [];
  regioesFamiliares: RegiaoFamiliar[] = [];
  errorMessage: string | null = null;
  isLoading = true;
  currentPersonId: number | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private pessoasService: PessoasService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController, // <-- INJETADO AQUI
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.currentPersonId = +id;
        this.loadTreeData(this.currentPersonId);
      } else if (this.authService.currentUserId) {
        this.currentPersonId = this.authService.currentUserId;
        this.loadTreeData(this.currentPersonId);
      } else {
        this.errorMessage = 'Nenhum ID de pessoa fornecido e usuário não logado. Não é possível carregar a árvore.';
        this.isLoading = false;
        this.presentToast(this.errorMessage, 'warning');
        this.cdr.detectChanges();
      }
    });
  }

  async loadTreeData(personId: number) {
    this.isLoading = true;
    this.errorMessage = null;
    this.rootPerson = null;
    this.allPersonsMap = {};
    this.allFamiliesMap = {};
    this.treeLevels = [];
    this.regioesFamiliares = [];

    const loading = await this.loadingController.create({
      message: 'Carregando árvore genealógica...',
      spinner: 'crescent'
    });
    await loading.present();

    this.pessoasService.getArvoreGenealogica(personId).subscribe({
      next: (response: ArvoreResponse) => {
        loading.dismiss();
        this.isLoading = false;

        this.rootPerson = response.root_person;
        this.regioesFamiliares = response.regioes_familiares;

        response.persons.forEach(p => {
          p.children_ids = p.children_ids || [];
          this.allPersonsMap[p.id!] = p;
        });

        response.families.forEach(f => {
          this.allFamiliesMap[f.id!] = f;
        });

        this.treeLevels = response.tree_levels.map(levelData => ({
          level: levelData.level,
          grouped_nodes: levelData.grouped_nodes.map(group => ({
            group_key: group.group_key,
            group_type: group.group_type,
            nodes: group.nodes.map(node => ({
              ...node,
              children_ids: node.children_ids || [],
              pai_data: node.pai ? this.allPersonsMap[node.pai] : undefined,
              mae_data: node.mae ? this.allPersonsMap[node.mae] : undefined,
              conjuge_data: node.conjuge ? this.allPersonsMap[node.conjuge] : undefined
            }) as Pessoa)
          }))
        }));

        console.log('Árvore carregada:', this.treeLevels);
        this.cdr.detectChanges();
      },
      error: async (err: HttpErrorResponse) => {
        loading.dismiss();
        this.isLoading = false;
        this.errorMessage = 'Não foi possível carregar a árvore genealógica. Verifique a conexão ou o ID.';
        console.error('Erro ao carregar árvore:', err);
        this.presentToast(this.errorMessage, 'danger');
        this.cdr.detectChanges();
      }
    });
  }

  // **** MÉTODO MODIFICADO: Abrir o Modal de Detalhes ****
  async goToPersonDetails(personId: number | undefined) {
    if (!personId || !this.allPersonsMap[personId]) {
      this.presentToast('Dados da pessoa não disponíveis para detalhes.', 'warning');
      return;
    }

    const personToShow = this.allPersonsMap[personId];

    const modal = await this.modalController.create({
      component: PersonDetailsModalComponent, // Componente do modal que criamos
      componentProps: {
        person: personToShow, // Passa o objeto Pessoa completo para o modal
        allPersonsMap: this.allPersonsMap // Passa o mapa de todas as pessoas para o modal
      }
    });
    await modal.present();
  }

  goToCreatePerson() {
    this.router.navigateByUrl('/pessoas/criar-pessoa');
  }

  goBackToList() {
    this.router.navigateByUrl('/pessoas/lista-pessoas');
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

  getSpouse(personId: number, family: FamilyUnit): Pessoa | null {
    if (family.husband_id === personId && family.wife_id && this.allPersonsMap[family.wife_id]) {
      return this.allPersonsMap[family.wife_id];
    }
    if (family.wife_id === personId && family.husband_id && this.allPersonsMap[family.husband_id]) {
      return this.allPersonsMap[family.husband_id];
    }
    return null;
  }

  hasChildren(person: Pessoa): boolean {
    return Array.isArray(person.children_ids) && person.children_ids.length > 0;
  }
}