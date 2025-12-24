import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/users`);
  }

  getUser(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/users/${id}`);
  }

  updateUser(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/users/${id}`, payload);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/users/${id}`);
  }
}
