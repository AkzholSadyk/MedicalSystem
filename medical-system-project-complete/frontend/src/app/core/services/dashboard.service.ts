import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  total_appointments: number;
  upcoming_appointments: number;
  total_records: number;
  total_doctors: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPatientStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/patient/stats`);
  }

  getDoctorStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboard/doctor/stats`);
  }
}
