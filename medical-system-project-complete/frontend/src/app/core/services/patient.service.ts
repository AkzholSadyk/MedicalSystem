import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Patient } from '../models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<Patient[]>(`${this.apiUrl}/patients/`);
  }

  getPatientById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.apiUrl}/patients/${id}`);
  }
}
