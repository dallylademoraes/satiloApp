// src/app/pessoas/person-details-modal/person-details-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Pessoa } from 'src/app/services/pessoas.service'; // Importe a interface Pessoa

@Component({
  selector: 'app-person-details-modal',
  templateUrl: './person-details-modal.component.html',
  styleUrls: ['./person-details-modal.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule
  ]
})
export class PersonDetailsModalComponent implements OnInit {
  @Input() person!: Pessoa; // O objeto Pessoa completo será passado para este modal
  @Input() allPersonsMap!: { [key: number]: Pessoa }; // O mapa de todas as pessoas para resolver pai/mãe/cônjuge

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    if (!this.person) {
      console.error('Nenhum objeto Pessoa passado para o modal.');
      // Opcional: fechar o modal ou exibir mensagem de erro
    }
  }

  // Método para fechar o modal
  async closeModal() {
    await this.modalController.dismiss();
  }

  // Helpers para exibir nomes de relacionamento
  getRelationName(id: number | null | undefined): string {
    if (id && this.allPersonsMap[id]) {
      return this.allPersonsMap[id].nome;
    }
    return 'Não informado';
  }
}