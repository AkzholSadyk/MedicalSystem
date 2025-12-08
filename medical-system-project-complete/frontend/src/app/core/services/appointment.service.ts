import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Appointment, CreateAppointment } from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Patient Endpoints
  getPatientAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments/patient`);
  }

  createAppointment(appointment: CreateAppointment): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/appointments/patient`, appointment);
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/appointments/${id}/cancel`, {});
  }

  // Doctor Endpoints
  getDoctorAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments/doctor`);
  }

  updateAppointmentStatus(id: number, status: 'completed' | 'cancelled'): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/appointments/${id}/status`, { status });
  }
}
