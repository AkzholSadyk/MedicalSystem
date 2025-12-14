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
  // Use the status update endpoint which the backend exposes as PATCH /appointments/{id}/status?status=...
  return this.updateAppointmentStatus(id, 'cancelled');
  }

  // Doctor Endpoints
  getDoctorAppointments(): Observable<Appointment[]> {
    // Backend exposes a role-aware GET /appointments which returns doctor-specific
    // appointments when the authenticated user is a doctor.
    return this.http.get<Appointment[]>(`${this.apiUrl}/appointments`);
  }

  // Calendar-specific endpoint: fetch events between two dates (YYYY-MM-DD)
  getCalendarAppointments(from?: string, to?: string) {
    let params = '';
    if (from) params += `from=${encodeURIComponent(from)}`;
    if (to) params += (params ? '&' : '') + `to=${encodeURIComponent(to)}`;
    return this.http.get<any[]>(`${this.apiUrl}/appointments/calendar${params ? '?' + params : ''}`);
  }

  updateAppointmentStatus(id: number, status: 'completed' | 'cancelled' | 'scheduled' | 'no_show'):
    Observable<Appointment> {
    // Backend expects a PATCH to /appointments/{id}/status with the status as a query param
    // or in some cases as a request body; the router defines a PATCH endpoint that
    // accepts `status` as a required query parameter. We'll send an empty body and
    // attach the status as a query param.
    return this.http.patch<Appointment>(
      `${this.apiUrl}/appointments/${id}/status?status=${encodeURIComponent(status)}`,
      {}
    );
  }
}
