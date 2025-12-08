import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/`);
  }

  getDoctorById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${id}`);
  }
}
