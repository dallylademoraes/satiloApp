// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular'; // Correção de import
import { Observable, BehaviorSubject, from, throwError } from 'rxjs'; // Importe 'from' e 'throwError'
import { tap, catchError } from 'rxjs/operators'; // Importe 'tap' e 'catchError'
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';

interface AuthResponse {
  token: string;
  user_id: number;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService { // <-- Certifique-se que 'export' está aqui!
  private API_URL = 'http://127.0.0.1:8000/api/'; // <-- Verifique o IP do seu Django

  private isAuthenticated = new BehaviorSubject<boolean>(false);
  currentAuthToken: string | null = null;
  currentUserId: number | null = null;
  currentUsername: string | null = null;

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private router: Router,
    private platform: Platform
  ) {
    this.init();
  }

  async init() {
    await this.storage.create();
    await this.checkToken();
  }

  async checkToken() {
    this.currentAuthToken = await this.storage.get('authToken');
    this.currentUserId = await this.storage.get('userId');
    this.currentUsername = await this.storage.get('username');
    if (this.currentAuthToken && this.currentUserId && this.currentUsername) {
      this.isAuthenticated.next(true);
      console.log('AuthService: Token encontrado. Usuário autenticado.');
    } else {
      this.isAuthenticated.next(false);
      console.log('AuthService: Nenhum token encontrado. Usuário não autenticado.');
    }
  }

  login(credentials: { username: string, password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}auth/`, credentials).pipe(
      tap(async (res) => {
        this.currentAuthToken = res.token;
        this.currentUserId = res.user_id;
        this.currentUsername = res.username;
        await this.storage.set('authToken', res.token);
        await this.storage.set('userId', res.user_id);
        await this.storage.set('username', res.username);
        this.isAuthenticated.next(true);
        console.log('AuthService: Login bem-sucedido. Token:', res.token);
      }),
      catchError(this.handleError)
    );
  }

  register(credentials: { username: string, password: string, password2: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}register/`, credentials).pipe(
      tap(async (res) => {
        this.currentAuthToken = res.token;
        this.currentUserId = res.user_id;
        this.currentUsername = res.username;
        await this.storage.set('authToken', res.token);
        await this.storage.set('userId', res.user_id);
        await this.storage.set('username', res.username);
        this.isAuthenticated.next(true);
        console.log('AuthService: Registro bem-sucedido. Token:', res.token);
      }),
      catchError(this.handleError)
    );
  }

  async logout() {
    this.currentAuthToken = null;
    this.currentUserId = null;
    this.currentUsername = null;
    await this.storage.remove('authToken');
    await this.storage.remove('userId');
    await this.storage.remove('username');
    this.isAuthenticated.next(false);
    console.log('AuthService: Logout realizado. Token removido.');
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Um erro desconhecido ocorreu.';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro do cliente: ${error.error.message}`;
    } else {
      errorMessage = `Erro do servidor: Código ${error.status}`;
      if (error.error) {
        if (typeof error.error === 'string') {
          try {
            const parsedError = JSON.parse(error.error);
            errorMessage += `\nDetalhes: ${JSON.stringify(parsedError)}`;
          } catch (e) {
            errorMessage += `\nDetalhes: ${error.error}`;
          }
        } else if (typeof error.error === 'object') {
          errorMessage += `\nDetalhes: ${JSON.stringify(error.error)}`;
        }
      }
    }
    console.error('AuthService Erro:', errorMessage);
    return throwError(() => new Error(errorMessage)); // Correção da sintaxe do throwError
  }

  async setCurrentUserPerson(personId: number, personName: string): Promise<void> {
    this.currentUserId = personId;
    this.currentUsername = personName; // Se você quiser armazenar o nome da pessoa 'Eu' também
    await this.storage.set('userId', personId);
    await this.storage.set('username', personName); // Armazene o nome da pessoa 'Eu'
    // IMPORTANTE: O token NÃO MUDA, apenas a representação do usuário logado na árvore.
    console.log(`AuthService: ID do usuário definido como ${personName} (ID: ${personId})`);
    // Pode ser útil para outras partes da aplicação reagir a essa mudança
    this.isAuthenticated.next(true); // Garante que o estado de autenticação continua como true
}
}