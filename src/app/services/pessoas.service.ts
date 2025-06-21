// src/app/services/pessoas.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';

// Defina uma interface para seu modelo Pessoa, baseada nos campos do seu PessoaSerializer no Django
export interface Pessoa {
  id?: number; // Opcional para criação (ID é gerado pelo backend)
  nome: string;
  genero: string;
  data_nascimento?: string | null; // Date em string (YYYY-MM-DD), pode ser null
  local_nascimento?: string | null;
  estado_nascimento?: string | null;
  data_falecimento?: string | null;
  data_falecimento_incerta?: boolean; // Booleano para indicar incerteza
  historia_pessoal?: string | null;
  foto?: File | string | null; // File para upload, string para URL, pode ser null
  pai?: number | null; // ID do pai, pode ser null
  mae?: number | null; // ID da mãe, pode ser null
  conjuge?: number | null; // ID do cônjuge, pode ser null

  // Campos de leitura apenas do Serializer / Dados da árvore
  foto_url?: string;
  idade?: number | string;
  status_vida?: string; // Ex: 'Vivo(a)', 'Falecido(a)'
  owner?: number; // ID do owner
  owner_data?: { id: number, username: string };
  pai_data?: { id: number, nome: string };
  mae_data?: { id: number, nome: string };
  conjuge_data?: { id: number, nome: string };
  children_ids?: number[]; // <-- ADICIONADO AQUI! (IDs dos filhos diretos para visualização da árvore)

  // Propriedades adicionais da API de Árvore (se necessário)
  relacao?: string; // Ex: "Pai", "Filho(a)", "Você"
  is_root_display_node?: boolean;
  is_user_selected?: boolean;
}

export interface FamilyUnit {
  id: string; // Ex: "family_1_2"
  type: 'family_unit';
  husband_id?: number;
  wife_id?: number;
  children_ids: number[];
}

export interface TreeLevel {
  level: number;
  grouped_nodes: {
    group_key: string;
    group_type: 'couple-group' | 'sibling-group' | 'solo-group';
    nodes: Pessoa[]; // Pessoas serializadas
  }[];
}

export interface RegiaoFamiliar {
  regiao: string;
  count: number;
}

export interface ArvoreResponse {
  root_person: Pessoa;
  persons: Pessoa[];
  families: FamilyUnit[];
  tree_levels: TreeLevel[];
  regioes_familiares: RegiaoFamiliar[];
}

@Injectable({
  providedIn: 'root'
})
export class PessoasService {
  private API_URL = 'http://127.0.0.1:8000/api/pessoas/';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.currentAuthToken;
    if (!token) {
      this.authService.logout();
      throw new Error('No authentication token available.');
    }
    return new HttpHeaders({
      'Authorization': `Token ${token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Um erro desconhecido ocorreu.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else if (error.status === 401 || error.status === 403) {
      errorMessage = 'Não autorizado. Por favor, faça login novamente.';
      this.authService.logout();
    } else if (error.error && typeof error.error === 'object') {
      const errorBody = error.error;
      const messages: string[] = [];

      if (errorBody.detail) {
        messages.push(`Detalhe: ${errorBody.detail}`);
      }
      if (errorBody.non_field_errors) {
        messages.push(`Erros: ${errorBody.non_field_errors.join('; ')}`);
      }
      for (const key in errorBody) {
        if (errorBody.hasOwnProperty(key) && key !== 'detail' && key !== 'non_field_errors') {
          const errorValue = errorBody[key];
          if (Array.isArray(errorValue)) {
            messages.push(`${key}: ${errorValue.map(e => String(e)).join(', ')}`);
          } else if (typeof errorValue === 'string') {
            messages.push(`${key}: ${errorValue}`);
          }
        }
      }
      errorMessage = messages.length > 0 ? messages.join('; ') : `Erro do servidor (${error.status}): ${JSON.stringify(error.error)}`;

    } else {
      errorMessage = `Erro do servidor (${error.status}): ${error.message || error.statusText}`;
    }
    console.error('PessoasService Erro:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  getTodasPessoas(): Observable<Pessoa[]> {
    return this.http.get<Pessoa[]>(this.API_URL, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getPessoa(id: number): Observable<Pessoa> {
    return this.http.get<Pessoa>(`${this.API_URL}${id}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  criarPessoa(pessoaData: { [key: string]: any }): Observable<Pessoa> {
    const formData = new FormData();
    for (const key in pessoaData) {
      const value = pessoaData[key];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'foto' && value instanceof File) {
          formData.append(key, value, value.name);
        } else if (['pai', 'mae', 'conjuge'].includes(key) && value === null) {
          formData.append(key, '');
        } else {
          formData.append(key, String(value));
        }
      } else if (value === '') {
        formData.append(key, '');
      }
    }

    const headers = new HttpHeaders({
      'Authorization': `Token ${this.authService.currentAuthToken}`
    });

    return this.http.post<Pessoa>(this.API_URL, formData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  atualizarPessoa(id: number, pessoaData: { [key: string]: any }): Observable<Pessoa> {
    const formData = new FormData();
    for (const key in pessoaData) {
      const value = pessoaData[key];
      if (value !== null && value !== undefined && value !== '') {
        if (key === 'foto' && value instanceof File) {
          formData.append(key, value, value.name);
        } else if (['pai', 'mae', 'conjuge'].includes(key) && value === null) {
          formData.append(key, '');
        } else {
          formData.append(key, String(value));
        }
      } else if (value === '') {
        formData.append(key, '');
      }
    }

    const headers = new HttpHeaders({
      'Authorization': `Token ${this.authService.currentAuthToken}`
    });

    return this.http.patch<Pessoa>(`${this.API_URL}${id}/`, formData, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  excluirPessoa(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}${id}/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getArvoreGenealogica(id: number): Observable<ArvoreResponse> {
    return this.http.get<ArvoreResponse>(`${this.API_URL}${id}/arvore/`, { headers: this.getAuthHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
}