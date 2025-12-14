import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medication } from '../models/medication.model';

@Injectable({
  providedIn: 'root'
})
export class MedicationService {
  private apiUrl = `${environment.apiUrl}/medications`;

  constructor(private http: HttpClient) { }


  getMedications(
    search?: string, 
    skip: number = 0, 
    limit: number = 100,
    form?: string,
    genericName?: string
  ): Observable<Medication[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    if (form) {
      params = params.set('form', form);
    }
    
    if (genericName) {
      params = params.set('generic_name', genericName);
    }
    
    return this.http.get<Medication[]>(this.apiUrl, { params });
  }

  
  searchMedications(query: string, limit: number = 10): Observable<Medication[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());
    
    return this.http.get<Medication[]>(`${this.apiUrl}/search`, { params });
  }

  getMedicationById(id: number): Observable<Medication> {
    return this.http.get<Medication>(`${this.apiUrl}/${id}`);
  }
}

