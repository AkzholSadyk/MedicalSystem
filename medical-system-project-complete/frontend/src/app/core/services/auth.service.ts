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
    // Fetch auth user first. If role is doctor, fetch `/doctors/me` and merge additional fields
    return this.http.get<User>(`${this.apiUrl}/auth/me`).pipe(
      tap(user => {
        if (user && user.role === 'doctor') {
          // Fetch doctor profile and merge
          this.http.get<any>(`${this.apiUrl}/doctors/me`).subscribe({
            next: (doctorProfile) => {
              const merged = { ...user, ...doctorProfile };
              localStorage.setItem('user', JSON.stringify(merged));
              this.currentUserSubject.next(merged as User);
            },
            error: () => {
              // If fetching doctor profile fails, fall back to auth user
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
            }
          });
        } else if (user && user.role === 'patient') {
          // Fetch patient profile and merge so avatar_url and other fields are persisted
          this.http.get<any>(`${this.apiUrl}/patients/me`).subscribe({
            next: (patientProfile) => {
              const merged = { ...user, ...patientProfile };
              localStorage.setItem('user', JSON.stringify(merged));
              this.currentUserSubject.next(merged as User);
            },
            error: () => {
              localStorage.setItem('user', JSON.stringify(user));
              this.currentUserSubject.next(user);
            }
          });
        } else {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }
      })
    );
  }

  // Get current user's profile (patient or doctor depending on role)
  getProfile(): Observable<any> {
    const user = this.currentUserValue || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
    const role = user?.role || 'patient';
    const endpoint = role === 'doctor' ? 'doctors' : 'patients';
    return this.http.get<any>(`${this.apiUrl}/${endpoint}/me`).pipe(
      // no local storage update here; caller can handle
    );
  }

  updateProfile(payload: any): Observable<any> {
    const user = this.currentUserValue || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
    const role = user?.role || 'patient';
    const endpoint = role === 'doctor' ? 'doctors' : 'patients';
    if (role === 'doctor') {
      return this.http.put<any>(`${this.apiUrl}/${endpoint}/me`, payload).pipe(
        tap(() => this.fetchCurrentUser().subscribe())
      );
    }

    return this.http.patch<any>(`${this.apiUrl}/${endpoint}/me`, payload).pipe(
      tap(() => this.fetchCurrentUser().subscribe())
    );
  }

  uploadProfileAvatar(file: File): Observable<any> {
    const user = this.currentUserValue || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null);
    const role = user?.role || 'patient';
    const endpoint = role === 'doctor' ? 'doctors' : 'patients';
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<any>(`${this.apiUrl}/${endpoint}/me/avatar`, form).pipe(
      tap(() => {
        // Refresh current user so avatar_url is saved into localStorage and BehaviorSubject
        this.fetchCurrentUser().subscribe({ next: () => {}, error: () => {} });
      })
    );
  }

  // WebAuthn (Passkeys) helpers
  webauthnRegisterOptions(username: string) {
    return this.http.get<any>(`${this.apiUrl}/webauthn/register/options`, { params: { username } });
  }

  webauthnRegisterVerify(username: string, payload: any) {
    return this.http.post<any>(`${this.apiUrl}/webauthn/register/verify`, payload, { params: { username } });
  }

  webauthnLoginOptions(username: string) {
    return this.http.get<any>(`${this.apiUrl}/webauthn/login/options`, { params: { username } });
  }

  webauthnLoginVerify(username: string, payload: any) {
    return this.http.post<any>(`${this.apiUrl}/webauthn/login/verify`, payload, { params: { username } });
  }

  // Simple camera-based face login (demo)
  faceRegister(username: string, imageBase64: string) {
    return this.http.post<any>(`${this.apiUrl}/face/register`, { username, image: imageBase64 });
  }

  faceLogin(username: string, imageBase64: string) {
    return this.http.post<any>(`${this.apiUrl}/face/login`, { username, image: imageBase64 });
  }

  /**
   * PromTech-compatible face verification: upload file as multipart/form-data
   * Expects FormData with field 'file' (UploadFile) and optional 'check_liveness'
   */
  faceVerifyFile(file: File, checkLiveness = true, username?: string | number) {
    const form = new FormData();
    form.append('file', file, file.name || 'photo.jpg');
    if (checkLiveness) form.append('check_liveness', 'true');
    if (username) form.append('username', String(username));
    // Do not set Content-Type so browser includes boundary
    return this.http.post<any>(`${this.apiUrl}/api/faceid/verify`, form);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }
}
