import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor } from '../models/doctor.model';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllDoctors(
    specialization?: string,
    clinic?: string,
    search?: string
  ): Observable<Doctor[]> {
    let params = new HttpParams();
    
    if (specialization) {
      params = params.set('specialization', specialization);
    }
    
    if (clinic) {
      params = params.set('clinic', clinic);
    }
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/`, { params });
  }

  getDoctorById(id: number): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.apiUrl}/doctors/${id}`);
  }
}
