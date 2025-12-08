import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalRecord } from '../models/record.model';

@Injectable({
  providedIn: 'root'
})
export class RecordService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Patient Endpoints
  getPatientRecords(): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.apiUrl}/medical-records/patient`);
  }

  getRecordById(id: number): Observable<MedicalRecord> {
    return this.http.get<MedicalRecord>(`${this.apiUrl}/medical-records/${id}`);
  }

  // Doctor Endpoints
  getPatientRecordsForDoctor(patientId: number): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecord[]>(`${this.apiUrl}/medical-records/doctor/patient/${patientId}`);
  }

  createRecord(record: Omit<MedicalRecord, 'id' | 'doctor_name' | 'created_at'>): Observable<MedicalRecord> {
    return this.http.post<MedicalRecord>(`${this.apiUrl}/medical-records/doctor`, record);
  }
}
