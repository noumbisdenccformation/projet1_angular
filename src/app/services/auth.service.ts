import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User, UserRole, LoginRequest, LoginResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    // Essayer l'API réelle d'abord
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email: credentials.username + '@clinique.com',
      password: credentials.password
    }).pipe(
      tap(response => this.setCurrentUser(response)),
      catchError(error => {
        console.warn('API non disponible, utilisation du mode mock:', error);
        // Fallback vers le mode mock
        return this.mockLogin(credentials);
      })
    );
  }

  private mockLogin(credentials: LoginRequest): Observable<LoginResponse> {
    const mockResponse: LoginResponse = {
      user: {
        id: 1,
        username: credentials.username,
        email: credentials.username + '@clinique.com',
        firstName: 'John',
        lastName: 'Doe',
        role: credentials.username === 'admin' ? UserRole.ADMIN : 
              credentials.username === 'doctor' ? UserRole.DOCTOR : UserRole.SECRETARY,
        isActive: true,
        createdAt: new Date()
      },
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token'
    };

    return new Observable(observer => {
      setTimeout(() => {
        this.setCurrentUser(mockResponse);
        observer.next(mockResponse);
        observer.complete();
      }, 1000);
    });
  }

  private setCurrentUser(response: LoginResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(response.user));
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    this.currentUserSubject.next(response.user);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null && this.getToken() !== null;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isDoctor(): boolean {
    return this.hasRole(UserRole.DOCTOR);
  }

  isSecretary(): boolean {
    return this.hasRole(UserRole.SECRETARY);
  }
} 