import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, LoginData, Token, RegisterData } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient, private router: Router) {
    const user = localStorage.getItem('user');
    this.currentUserSubject = new BehaviorSubject<User | null>(user ? JSON.parse(user) : null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  public get userRole(): string | null {
    return this.currentUserValue ? this.currentUserValue.role : null;
  }

  login(loginData: LoginData): Observable<Token> {
    const body = new URLSearchParams();
    body.set('username', loginData.username);
    body.set('password', loginData.password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post<Token>(`${this.apiUrl}/auth/login`, body.toString(), { headers }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        this.fetchCurrentUser().subscribe();
      })
    );
  }

  register(registerData: RegisterData): Observable<Token> {
    return this.http.post<Token>(`${this.apiUrl}/auth/register`, registerData).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        this.fetchCurrentUser().subscribe();
      })
    );
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}
