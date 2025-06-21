// src/app/pipes/filter-by-gender.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { Pessoa } from '../services/pessoas.service'; // Ajuste o caminho conforme necessário

@Pipe({
  name: 'filterByGender',
  standalone: true // É importante que seja standalone para importação direta em componentes standalone
})
export class FilterByGenderPipe implements PipeTransform {
  transform(pessoas: Pessoa[] | null, gender: string): Pessoa[] {
    if (!pessoas || !gender) {
      return [];
    }
    return pessoas.filter(pessoa => pessoa.genero === gender);
  }
}